import "@orbit-styles";
import { useEffect } from "react";
import { Card, Headings, Text } from "@orbit";
import { WelcomeCard } from "../../ported/src/pages/ClauseIQV4.welcome";
import { toast } from "@/components/ui/sonner";

export default function ClauseIQV4OrbitPreview() {
  // Force the page chrome (html/body) to use Orbit tokens so the entire viewport
  // reads as Orbit, not the Lovable Tailwind default. Without this, the
  // surrounding background and inherited font-family stay on Lovable defaults
  // even though the ported card renders Orbit primitives correctly.
  useEffect(() => {
    const prev = {
      htmlBg: document.documentElement.style.background,
      bodyBg: document.body.style.background,
      bodyFont: document.body.style.fontFamily,
      bodyColor: document.body.style.color,
    };
    document.documentElement.style.background = "var(--orbit-color-bg-default)";
    document.body.style.background = "var(--orbit-color-bg-default)";
    document.body.style.fontFamily = "var(--orbit-font-family-sans)";
    document.body.style.color = "var(--orbit-color-text-primary)";
    return () => {
      document.documentElement.style.background = prev.htmlBg;
      document.body.style.background = prev.bodyBg;
      document.body.style.fontFamily = prev.bodyFont;
      document.body.style.color = prev.bodyColor;
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--orbit-color-bg-default)",
        padding: "var(--orbit-space-xl) var(--orbit-space-base)",
        fontFamily: "var(--orbit-font-family-sans)",
        color: "var(--orbit-color-text-primary)",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "var(--orbit-space-base)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--orbit-space-xxs)",
          }}
        >
          <Text size="Small" variant="Secondary" as="div">
            Lovable → Orbit port preview
          </Text>
          <Headings size="Heading 4">Scope 1 — Welcome card</Headings>
        </div>

        <Card type="Static" padding="Small" state="Accent">
          <Text size="Small" variant="Primary" as="p">
            This page is rendered entirely with Orbit primitives (
            <Text size="Small" variant="Bold" as="span">Card</Text>,{" "}
            <Text size="Small" variant="Bold" as="span">Headings</Text>,{" "}
            <Text size="Small" variant="Bold" as="span">Text</Text>,{" "}
            <Text size="Small" variant="Bold" as="span">Avatar</Text>,{" "}
            <Text size="Small" variant="Bold" as="span">FaIcon</Text>,{" "}
            <Text size="Small" variant="Bold" as="span">Button</Text>
            ) loaded from{" "}
            <Text size="Small" variant="Bold" as="span">@efficio/orbit</Text>.
            The Inter family + Font Awesome 6 Pro are both served from the local
            Orbit package via Vite alias.
          </Text>
        </Card>

        <WelcomeCard onGetStarted={() => toast.success("Get Started clicked")} />
      </div>
    </div>
  );
}
