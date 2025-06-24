export default function Footer({ githubUrl, handleName }: { githubUrl: string, handleName: string }) {
  return (
    <footer className="text-center py-6 mt-16">
    <p className="text-gray-700">
      Created by{" "}
      <a className="text-sky-500" href={githubUrl}>
        @{handleName}
      </a>{" "}
      &copy; 2025
    </p>
  </footer>
  )
}