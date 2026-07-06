interface LogoutButtonProps {
  onLogout: () => void;
  light?: boolean;
}

export default function LogoutButton({ onLogout, light }: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={onLogout}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 ease active:scale-95 ${
        light ? "bg-cream/10 text-cream hover:bg-cream/20" : "bg-brown/10 text-brown hover:bg-brown/20"
      }`}
    >
      Logout
    </button>
  );
}
