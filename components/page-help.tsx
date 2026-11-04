import type { Dictionary } from "@/lib/i18n";
import { GuideContent } from "./guide";
import { HelpSheet } from "./help-sheet";

export function PageHelp({
  topic,
  dict,
}: {
  topic: keyof Dictionary["help"]["guides"];
  dict: Dictionary;
}) {
  const guide = dict.help.guides[topic];

  return (
    <HelpSheet
      title={guide.title}
      buttonLabel={dict.help.button}
      allGuidesLabel={dict.help.allGuides}
      closeLabel={dict.common.close}
    >
      <GuideContent guide={guide} tipsLabel={dict.help.tips} />
    </HelpSheet>
  );
}
