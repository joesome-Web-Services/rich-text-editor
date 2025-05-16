import { useEffect } from "react";

interface GoogleAdProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical";
  style?: React.CSSProperties;
}

export function GoogleAd({ slot, format = "auto", style }: GoogleAdProps) {
  const publisherId = import.meta.env.VITE_AD_SENSE_PUBLISHER_ID;

  useEffect(() => {
    if (!publisherId) {
      console.warn("AdSense publisher ID not found in environment variables");
      return;
    }

    // Load Google AdSense script
    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("Error loading Google Ad:", err);
    }

    return () => {
      document.head.removeChild(script);
    };
  }, [publisherId]);

  if (!publisherId) {
    return null;
  }

  return (
    <ins
      className="adsbygoogle"
      style={style}
      data-ad-client={publisherId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
