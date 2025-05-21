import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getConfigurationFn } from "./header";

export function FooterSection() {
  const { data: configuration } = useQuery({
    queryKey: ["configuration"],
    queryFn: getConfigurationFn,
  });

  return (
    <footer className="border-t border-gray-200 py-16 px-6 bg-gradient-to-b from-white to-rose-50">
      <div className="max-w-4xl mx-auto text-gray-600">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="font-serif text-gray-900 mb-4 text-lg">
              Navigation
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="hover:text-rose-600 transition-colors font-light"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-rose-600 transition-colors font-light"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-gray-900 mb-4 text-lg">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/terms-of-service"
                  className="hover:text-rose-600 transition-colors font-light"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="hover:text-rose-600 transition-colors font-light"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-gray-900 mb-4 text-lg">Connect</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${configuration?.email}`}
                  className="hover:text-rose-600 transition-colors font-light"
                >
                  Email Me
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-rose-100">
          <p className="font-light text-sm">
            © {new Date().getFullYear()} {configuration?.company}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
