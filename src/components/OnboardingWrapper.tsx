"use client";
import { useState } from "react";
import { OnboardingPopup } from "./OnboardingPopup";
import { useRouter } from "next/navigation";

export function OnboardingWrapper() {
  const [visivel, setVisivel] = useState(true);
  const router = useRouter();

  if (!visivel) return null;

  return (
    <OnboardingPopup
      onConcluido={() => {
        setVisivel(false);
        router.refresh();
      }}
    />
  );
}
