"use client";

import { useEffect, useRef } from "react";
import AuthInput from "@/components/auth/AuthInput";
import { drawChallengeImage } from "@/lib/auth/captcha";

export default function Captcha({ challenge, value, onChange, id = "captcha", error }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    drawChallengeImage(canvasRef.current, challenge.text);
  }, [challenge.text]);

  return (
    <div className="mb-4">
      <canvas
        ref={canvasRef}
        width={180}
        height={60}
        role="img"
        aria-label="Verification image. Enter the characters shown below."
        className="max-w-full h-auto rounded border border-brown/40"
      />
      <AuthInput
        id={id}
        name="captcha"
        label="Enter the characters shown above"
        value={value}
        onChange={onChange}
        required
        error={error}
      />
    </div>
  );
}
