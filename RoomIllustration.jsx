// A drawn room used on the landing page. It is an illustration, not AI output.
export default function RoomIllustration({ variant = "before" }) {
  const styled = variant === "after";
  const wall = styled ? "#A9B79F" : "#D8D2C6";
  const floor = styled ? "#C7A07A" : "#B5AB99";

  return (
    <svg
      className="room-illustration"
      viewBox="0 0 800 560"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={styled ? "Illustration of a styled living room" : "Illustration of a plain, sparsely furnished living room"}
    >
      <rect width="800" height="370" fill={wall} />
      <rect y="370" width="800" height="190" fill={floor} />
      <rect y="360" width="800" height="12" fill={styled ? "#F3EEE4" : "#CFC8BA"} />
      {styled &&
        [405, 440, 478, 520].map((y) => <line key={y} x1="0" x2="800" y1={y} y2={y} stroke="#8A6F55" strokeOpacity=".25" />)}

      {/* window */}
      <rect x="520" y="70" width="190" height="190" fill="#EAF1F2" stroke={styled ? "#F3EEE4" : "#F0ECE3"} strokeWidth="10" />
      <line x1="615" x2="615" y1="70" y2="260" stroke={styled ? "#F3EEE4" : "#F0ECE3"} strokeWidth="6" />
      <line x1="520" x2="710" y1="165" y2="165" stroke={styled ? "#F3EEE4" : "#F0ECE3"} strokeWidth="6" />

      {styled ? (
        <>
          <polygon points="520,372 710,372 780,540 560,540" fill="#FFFFFF" opacity=".16" />
          <rect x="488" y="55" width="34" height="230" rx="6" fill="#F3EEE4" />
          <rect x="708" y="55" width="34" height="230" rx="6" fill="#F3EEE4" />
          {/* wall art */}
          <rect x="120" y="95" width="130" height="150" fill="#2A2926" />
          <rect x="130" y="105" width="110" height="130" fill="#F6F1E7" />
          <circle cx="185" cy="160" r="30" fill="#B5654A" />
          <path d="M130 235v-40a55 55 0 0 1 110 0v40z" fill="#5B6B56" opacity=".85" />
          {/* rug */}
          <polygon points="140,448 660,448 720,540 80,540" fill="#E8DECB" />
          <polygon points="170,458 630,458 678,530 122,530" fill="none" stroke="#B5654A" strokeWidth="3" opacity=".7" />
        </>
      ) : (
        <rect x="590" y="388" width="100" height="62" fill="#A59C8B" />
      )}

      {/* sofa */}
      <rect x="165" y="395" width="14" height="22" fill="#3B352F" />
      <rect x="521" y="395" width="14" height="22" fill="#3B352F" />
      <rect x="150" y="300" width="400" height="105" rx="22" fill={styled ? "#F2EBDD" : "#8F8D87"} />
      <rect x="185" y="270" width="330" height="95" rx="20" fill={styled ? "#EAE1CF" : "#7F7D78"} />
      <rect x="140" y="320" width="48" height="92" rx="20" fill={styled ? "#F2EBDD" : "#8F8D87"} />
      <rect x="512" y="320" width="48" height="92" rx="20" fill={styled ? "#F2EBDD" : "#8F8D87"} />
      {styled && (
        <>
          <rect x="215" y="300" width="72" height="62" rx="14" fill="#B5654A" transform="rotate(-6 251 331)" />
          <rect x="420" y="302" width="72" height="62" rx="14" fill="#5B6B56" transform="rotate(5 456 333)" />
          {/* coffee table */}
          <ellipse cx="350" cy="492" rx="105" ry="24" fill="#5A4632" />
          <rect x="268" y="496" width="8" height="34" fill="#3B2E21" />
          <rect x="424" y="496" width="8" height="34" fill="#3B2E21" />
          {/* plant */}
          <rect x="612" y="408" width="48" height="56" rx="8" fill="#B5654A" />
          <ellipse cx="636" cy="370" rx="16" ry="46" fill="#5B6B56" transform="rotate(-24 636 400)" />
          <ellipse cx="636" cy="365" rx="16" ry="50" fill="#6F8168" />
          <ellipse cx="636" cy="370" rx="16" ry="46" fill="#4E5E4A" transform="rotate(24 636 400)" />
          {/* floor lamp */}
          <line x1="96" x2="96" y1="215" y2="430" stroke="#2A2926" strokeWidth="5" />
          <polygon points="66,215 126,215 112,165 80,165" fill="#F3EEE4" />
          <ellipse cx="96" cy="432" rx="26" ry="6" fill="#2A2926" />
        </>
      )}
    </svg>
  );
}
