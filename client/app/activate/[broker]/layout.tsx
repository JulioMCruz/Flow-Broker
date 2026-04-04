export function generateStaticParams() {
  return ["guardian","sentinel","steady","navigator","growth","momentum","apex","titan"].map(broker => ({ broker }))
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
