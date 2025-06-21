import {Outlet} from "react-router";
import Header from "./header";
import Hero from "./hero";
import Footer from "./footer";
import {UserInfo} from "@/constants";

export default function Layout() {
  return (
    <>
      <div className="container mx-auto pb-16 min-h-screen px-4">
        
        {/* Header */}
        <Header />

        {/* Hero Section - トップページのみ表示 */}
        <Hero />

        <section className="space-y-6 max-w-4xl mx-auto">
          {/* Page Content */}
          <Outlet />
        </section>

        {/* Footer */}
        <Footer
          githubUrl={UserInfo.GITHUB_URL}
          handleName={UserInfo.HANDLE_NAME}
        />
      </div>
    </>
  );
}
