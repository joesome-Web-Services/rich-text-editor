import { Button } from "~/components/ui/button";
import { Link } from "@tanstack/react-router";

export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full bg-gradient-to-b from-rose-50/50 to-rose-100/30">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -right-64 w-[500px] h-[500px] bg-rose-100/50 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-pink-50/50 rounded-full opacity-40 blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <h1 className="font-serif text-7xl sm:text-8xl font-light mb-6 text-gray-900">
              Stories That <span className="italic text-rose-700">Inspire</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed font-light max-w-xl">
              Welcome to my corner of the internet where we explore life's
              beautiful moments, share meaningful stories, and find inspiration
              in everyday experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/books">
                <Button
                  size="lg"
                  className="bg-rose-600 hover:bg-rose-700 text-white w-full sm:w-auto px-8 relative font-light"
                >
                  Read Latest Stories
                </Button>
              </Link>
              <Link to="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-8 rounded-md relative border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  About Me
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
