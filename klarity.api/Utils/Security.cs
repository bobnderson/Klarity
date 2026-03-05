using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Primitives;

namespace Klarity.Api.Utils
{
    public class Security
    {
        private readonly IConfiguration _configuration;

        public Security(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return string.Empty;

            try
            {
                byte[] iv = new byte[16];
                byte[] array;

                using (Aes aes = Aes.Create())
                {
                    aes.Key = Encoding.UTF8.GetBytes(GetKey());
                    aes.IV = iv;

                    ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

                    using (MemoryStream memoryStream = new MemoryStream())
                    {
                        using (CryptoStream cryptoStream = new CryptoStream(memoryStream, encryptor, CryptoStreamMode.Write))
                        {
                            using (StreamWriter streamWriter = new StreamWriter(cryptoStream))
                            {
                                streamWriter.Write(plainText);
                            }
                            array = memoryStream.ToArray();
                        }
                    }
                }

                return Convert.ToBase64String(array);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encryption error: {ex.Message}");
                throw;
            }
        }

        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText)) return string.Empty;

            try
            {
                byte[] iv = new byte[16];
                byte[] buffer = Convert.FromBase64String(cipherText);

                using (Aes aes = Aes.Create())
                {
                    aes.Key = Encoding.UTF8.GetBytes(GetKey());
                    aes.IV = iv;
                    ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

                    using (MemoryStream memoryStream = new MemoryStream(buffer))
                    {
                        using (CryptoStream cryptoStream = new CryptoStream(memoryStream, decryptor, CryptoStreamMode.Read))
                        {
                            using (StreamReader streamReader = new StreamReader(cryptoStream))
                            {
                                return streamReader.ReadToEnd();
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Decryption error: {ex.Message}");
                throw;
            }
        }

        public string GenerateToken(object data)
        {
            string jsonData = JsonSerializer.Serialize(data);
            return Encrypt(jsonData);
        }

        public bool EvaluateToken<T>(HttpRequest request, out T? userData) where T : class
        {
            userData = null;
            
            // Look for X-Auth-Token header (custom header to avoid collision with IIS Windows Auth)
            string? token = request.Headers["X-Auth-Token"].ToString();
            
            if (string.IsNullOrEmpty(token)) 
            {
                // Fallback check for standard Authorization header (for backward compatibility or simple setups)
                string authHeader = request.Headers["Authorization"].ToString();
                if (!string.IsNullOrEmpty(authHeader))
                {
                    token = authHeader.Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase).Trim();
                }
            }

            if (string.IsNullOrEmpty(token)) return false;

            try
            {
                var decryptedData = Decrypt(token);
                userData = JsonSerializer.Deserialize<T>(decryptedData);
                return userData != null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Token evaluation error: {ex.Message}");
                return false;
            }
        }

        private string GetKey()
        {
            string? key = _configuration["env:SecurityKey"];

            if (string.IsNullOrEmpty(key) || key.Length < 32)
            {
                throw new InvalidOperationException("SecurityKey must be at least 32 characters long.");
            }

            return key.Substring(0, 32);
        }
    }
}
