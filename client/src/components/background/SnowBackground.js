"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSnowPreset } from "@tsparticles/preset-snow";

const SnowBackground = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSnowPreset(engine);
    }).then(() => {
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  return (
    <Particles
      id="snow-background"
      options={{
        preset: "snow",
        fullScreen: {
          enable: true,   
          zIndex: 0
        },
        background: {
          opacity: 0,
        }
      }}
    />
  );
};

export default SnowBackground;
