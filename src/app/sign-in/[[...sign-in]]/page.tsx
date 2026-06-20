import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-jorrey-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl tracking-[0.15em] text-jorrey-white mb-2">
            JORREY
          </h1>
          <p className="text-jorrey-white/40 text-sm tracking-widest uppercase">
            Admin Portal
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-[#111] border border-jorrey-white/10 shadow-none rounded-none",
              headerTitle: "text-jorrey-white font-serif",
              headerSubtitle: "text-jorrey-white/40",
              formFieldLabel: "text-jorrey-white/70 text-xs tracking-widest uppercase",
              formFieldInput:
                "bg-transparent border-jorrey-white/20 text-jorrey-white rounded-none focus:border-jorrey-gold",
              formButtonPrimary:
                "bg-jorrey-gold text-jorrey-black rounded-none hover:bg-jorrey-gold-light tracking-widest uppercase text-xs font-semibold",
              footerActionLink: "text-jorrey-gold",
              identityPreviewText: "text-jorrey-white",
              identityPreviewEditButton: "text-jorrey-gold",
            },
          }}
        />
      </div>
    </div>
  );
}
