"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";

type Props = {
  orderId: string;
  defaultTargetLat: number | null;
  defaultTargetLng: number | null;
};

export function DispatchSimulator({ orderId, defaultTargetLat, defaultTargetLng }: Props) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [running, setRunning] = useState(false);
  const [riderId, setRiderId] = useState("");
  const [startLat, setStartLat] = useState(14.5995);
  const [startLng, setStartLng] = useState(120.9842);
  const [targetLat, setTargetLat] = useState(defaultTargetLat ?? 14.6095);
  const [targetLng, setTargetLng] = useState(defaultTargetLng ?? 121.0042);
  const [lastPoint, setLastPoint] = useState<string>("");

  async function runStep() {
    const response = await fetch("/api/dispatch/simulate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId,
        riderId,
        startLat,
        startLng,
        targetLat,
        targetLng,
      }),
    });

    if (!response.ok) return;
    const data = (await response.json()) as { lat: number; lng: number; closeEnough: boolean };
    setStartLat(data.lat);
    setStartLng(data.lng);
    setLastPoint(`${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`);

    if (data.closeEnough && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setRunning(false);
    }
  }

  function startSimulation() {
    if (!riderId || running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      runStep().catch(() => null);
    }, 1800);
  }

  function stopSimulation() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }

  return (
    <div className="mt-3 rounded-xl border border-border-muted bg-background-app p-3">
      <p className="text-xs font-semibold text-text-secondary">Auto Simulate Rider Movement</p>
      <div className="mt-2 grid gap-2 md:grid-cols-5">
        <Input value={riderId} onChange={(event) => setRiderId(event.target.value)} placeholder="Rider ID" />
        <Input type="number" step="0.00001" value={startLat} onChange={(event) => setStartLat(Number(event.target.value))} placeholder="Start lat" />
        <Input type="number" step="0.00001" value={startLng} onChange={(event) => setStartLng(Number(event.target.value))} placeholder="Start lng" />
        <Input type="number" step="0.00001" value={targetLat} onChange={(event) => setTargetLat(Number(event.target.value))} placeholder="Target lat" />
        <Input type="number" step="0.00001" value={targetLng} onChange={(event) => setTargetLng(Number(event.target.value))} placeholder="Target lng" />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button type="button" onClick={startSimulation} disabled={running || !riderId}>
          Start simulation
        </Button>
        <Button type="button" variant="secondary" onClick={stopSimulation} disabled={!running}>
          Stop
        </Button>
        {lastPoint && <p className="text-xs text-text-muted">Last point: {lastPoint}</p>}
      </div>
    </div>
  );
}
