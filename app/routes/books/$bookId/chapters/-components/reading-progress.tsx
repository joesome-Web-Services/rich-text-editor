import { useEffect, useState } from "react";
import { Progress } from "~/components/ui/progress";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    window.addEventListener("scroll", updateProgress);
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <div className="fixed top-[80px] left-0 right-0 z-[50]">
      <Progress
        value={progress}
        className="h-0.5 rounded-none bg-rose-100 [&>div]:bg-rose-400"
      />
    </div>
  );
}
