import { useEffect, useEffectEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useSettings } from "../app/use-settings";
import { matchesSensorIdToMode } from "../lib/data-mode";

const WS_URL = import.meta.env.VITE_WS_URL;

export function useLiveFeed() {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const { dataMode } = useSettings();

  const onMeasurement = useEffectEvent(() => {
    queryClient.invalidateQueries({ queryKey: ["latest"] });
    queryClient.invalidateQueries({ queryKey: ["sensors"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: ["measurements"] });
  });

  const onAlert = useEffectEvent((payload: Array<{ message: string; sensorId: string }> | { message: string; sensorId: string }) => {
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
    const events = Array.isArray(payload) ? payload : [payload];
    const first = events.find((event) => matchesSensorIdToMode(event.sensorId, dataMode));
    if (first?.message) {
      toast.warning(first.message);
    }
  });

  useEffect(() => {
    const socket = io(WS_URL ?? window.location.origin, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("measurement:new", onMeasurement);
    socket.on("sensor:status", onMeasurement);
    socket.on("alert:event", onAlert);

    return () => {
      socket.disconnect();
    };
  }, []);

  return { connected };
}
