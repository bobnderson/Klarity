import { useRef, useEffect } from "react";
import type { Vessel, Voyage } from "../../types/maritime/marine";
import type { MovementRequest } from "../../types/maritime/logistics";

interface HelicopterView2DProps {
  vessel: Vessel;
  voyage: Voyage;
  manifest: MovementRequest[];
  loading?: boolean;
}

export function HelicopterView2D({
  vessel,
  voyage,
  manifest,
  loading,
}: HelicopterView2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="deck-view-container"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#eef2f6",
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255,255,255,0.7)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Loading Deck Data...
        </div>
      )}
      <div style={{ textAlign: "center", color: "#666" }}>
        <h3>Helicopter Layout: {vessel.vesselName}</h3>
        <p>Capacity: {vessel.capacities?.totalComplement || 0} Passengers</p>
        <div
          style={{
            marginTop: 20,
            width: 300,
            height: 400,
            border: "2px solid #ccc",
            borderRadius: "40px 40px 20px 20px",
            margin: "0 auto",
            position: "relative",
            backgroundColor: "#fff",
          }}
        >
          {/* Simple Helicopter visual placeholder */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              width: 200,
              height: 200,
              border: "1px dashed #999",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Rotor Zone
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
              right: 20,
              height: 150,
              border: "1px solid #ddd",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 5,
              padding: 5,
            }}
          >
            {/* Seating Placeholder */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#e3f2fd",
                  border: "1px solid #90caf9",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                }}
              >
                Seat {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
