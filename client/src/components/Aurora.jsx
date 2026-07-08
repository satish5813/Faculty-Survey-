// Clean, flat background — no gradients. Solid light base with a subtle dotted texture.
export default function Aurora() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#f5f6fb]">
      <div className="absolute inset-0 bg-grid opacity-70" />
    </div>
  );
}
