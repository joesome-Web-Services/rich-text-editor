import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Mail, Twitter } from "lucide-react";
import { configuration } from "~/config";

export const Route = createFileRoute("/about")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="mt-32 container mx-auto px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            About the Author
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {configuration.name}
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Crafting stories that inspire and connect
          </p>
        </div>

        {/* Bio Section */}
        <div className="prose prose-lg mx-auto mb-12">
          <p className="lead text-gray-600">
            Hello! I'm Sarah, a passionate writer based in San Francisco with a
            love for crafting narratives that explore human connections and
            personal growth.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
            My Writing Journey
          </h2>
          <p className="text-gray-600">
            My journey into writing began over a decade ago when I started
            journaling about my travels across Southeast Asia. What started as
            personal reflections soon evolved into a deep passion for
            storytelling. Today, I focus on creating fiction that weaves
            together themes of personal discovery, cultural understanding, and
            the bonds that connect us all.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
            What I Write
          </h2>
          <p className="text-gray-600">
            I specialize in contemporary fiction and personal essays that
            explore the complexities of modern relationships, cultural identity,
            and personal transformation. My work has been featured in various
            literary magazines and online publications.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
            Connect With Me
          </h2>
          <p className="text-gray-600 mb-8">
            I love hearing from readers and fellow writers. Whether you want to
            discuss my latest work, share your own writing journey, or explore
            potential collaborations, I'm always open to connecting.
          </p>
        </div>

        {/* Contact Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            variant="outline"
            className="inline-flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            <span>Email Me</span>
          </Button>
          <Button
            variant="outline"
            className="inline-flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Twitter className="w-4 h-4" aria-hidden="true" />
            <span>Follow on Twitter</span>
          </Button>
        </div>
      </div>
    </main>
  );
}
