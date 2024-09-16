import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto py-4">
      <div className="flex justify-center space-x-4">
        <Link href="https://warpcast.com/~/channel/imperfectform">
          Farcaster
        </Link>
        <Link href="https://github.com/thisyearnofear">Github</Link>
        <Link href="https://imperfectform.vercel.app/">Pushup</Link>
        <Link href="https://hey.xyz/u/papajams">Lens</Link>
        <Link href="https://twitter.com/papajimjams">X</Link>
      </div>
    </footer>
  );
}
