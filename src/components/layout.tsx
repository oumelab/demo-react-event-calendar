import { Outlet } from "react-router";
import Header from "./header";
import Footer from "./footer";

const TWITTER_URL = "#";
const GITHUB_URL = "#";
const HANDLE_NAME = "your-handle";
export default function Layout() {
  return (
    <>
      <div className="container mx-auto py-16 space-y-8 min-h-screen px-4 md:px-0">
        {/* Header */}
        <Header twitterUrl={TWITTER_URL} />

        {/* Page Content */}
        <Outlet />

        {/* Footer */}
        <Footer githubUrl={GITHUB_URL} handleName={HANDLE_NAME} />
      </div>
    </>
  );
};