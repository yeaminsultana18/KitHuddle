const PATHS = {
  jersey: 'M8 3l-5 3 2 4 2-1v12h10V9l2 1 2-4-5-3c0 2-2 3-4 3s-4-1-4-3z',
  shorts: 'M5 4h14l1 15h-6l-2-8-2 8H4z',
  boot: 'M3 16V8h6l2 3 7 2c2 .5 3 1.5 3 3v1H3z M3 19h18',
  ball: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7l4 3-1.5 4.5h-5L8 10z',
  bat: 'M5 19l7-7 M11 9.5l5.5-5.5a1.5 1.5 0 0 1 2.1 0l1.4 1.4a1.5 1.5 0 0 1 0 2.1L14.5 13z',
  gloves: 'M7 21v-8l-2-3V6a1.5 1.5 0 0 1 3 0v3V4.5a1.5 1.5 0 0 1 3 0V9V5a1.5 1.5 0 0 1 3 0v4V7a1.5 1.5 0 0 1 3 0v7c0 3-2 5-4 7z',
  shoe: 'M3 17c3 0 4-1 6-4l2 2c1 1 3 2 5 2h4v3H5c-1 0-2-1-2-3z M9 13l2-5 3 2',
  socks: 'M9 3h6v9l3 4c1 2 0 5-3 5-1.5 0-2.5-.5-3.5-1.5L7 15V3z',
}

export default function SportIcon({ name, className = 'h-28 w-28' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name] || PATHS.jersey} />
    </svg>
  )
}
