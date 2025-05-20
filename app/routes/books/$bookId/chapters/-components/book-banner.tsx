import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Twitter,
  Facebook,
  Linkedin,
  Link as LinkIcon,
} from "lucide-react";
import { getBookFn, getChapterFn } from "../-funs";
import { Button } from "~/components/ui/button";
import { useToast } from "~/hooks/use-toast";
import { isAdminFn } from "~/fn/auth";
import { useState } from "react";
import { useEffect } from "react";

interface BookBannerProps {
  bookId: string;
  chapterId: string;
}

export function BookBanner({ bookId, chapterId }: BookBannerProps) {
  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: isAdminFn,
  });

  const { data: bookData } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => getBookFn({ data: { bookId } }),
  });

  const { data: chapterData } = useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: () =>
      getChapterFn({
        data: {
          chapterId,
        },
      }),
  });

  const { toast } = useToast();

  const [shareLinks, setShareLinks] = useState({
    twitter: "",
    facebook: "",
    linkedin: "",
  });

  useEffect(() => {
    const url = window.location.href;

    setShareLinks({
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(chapterData?.chapter.title ?? "")}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    });
  }, [chapterData]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "The chapter link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying the link manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className={`${isAdmin ? "pt-16" : "pt-4"} bg-white border-b border-gray-200 pb-4`}
    >
      <div className="max-w-5xl mx-auto px-4">
        <p className="text-sm text-gray-500 mb-2">You are reading</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to="/books/$bookId"
              className="flex gap-2 items-center"
              params={{
                bookId: bookId,
              }}
            >
              <ChevronLeft className="size-5" />

              {bookData?.book.coverImage?.data ? (
                <img
                  src={bookData.book.coverImage.data}
                  alt={`Cover for ${bookData.book.title}`}
                  className="size-6 object-cover rounded-full shadow-md"
                />
              ) : (
                <div className="size-6 rounded-full bg-gray-200 shadow-md" />
              )}
              <div className="text-xl font-serif text-gray-800">
                {bookData?.book.title ? (
                  bookData.book.title
                ) : (
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">/</span>
                {chapterData?.chapter.title ? (
                  <div className="text-lg font-serif text-gray-600">
                    {chapterData.chapter.title}
                  </div>
                ) : (
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                )}
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            Share on
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(shareLinks.twitter, "_blank")}
              title="Share on Twitter"
            >
              <Twitter className="h-4 w-4" />
            </Button>
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(shareLinks.facebook, "_blank")}
              title="Share on Facebook"
            >
              <Facebook className="h-4 w-4" />
            </Button> */}
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(shareLinks.linkedin, "_blank")}
              title="Share on LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </Button> */}
            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              title="Copy link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
