import type { ReactNode } from "react";
import { FA, FaIcon } from "@orbit";
import { CpNotificationsRailControl } from "@/components/prototype-cp-shared/CpNotifications";
import { CpIconButton, CpRailButton } from "@/components/prototype-cp-shared/orbit";

export const CP_FA = {
  admin: "\uf0c0",
  aiChip: "\uf544",
  angleDown: FA.angleDown,
  angleUp: FA.angleUp,
  arrowLeft: "\uf060",
  arrowRight: "\uf061",
  bell: "\uf0f3",
  briefcase: "\uf0b1",
  chart: "\uf080",
  check: FA.check,
  chevronDown: FA.angleDown,
  chevronUp: FA.angleUp,
  clipboard: "\uf328",
  cloud: "\uf0c2",
  comment: "\uf075",
  download: "\uf019",
  ellipsis: "\uf141",
  file: FA.file,
  filePlus: "\uf319",
  filter: "\uf0b0",
  gear: "\uf013",
  globe: "\uf0ac",
  hand: "\uf256",
  home: "\uf015",
  info: FA.circleInfo,
  lightbulb: "\uf0eb",
  list: "\uf03a",
  lock: "\uf023",
  magic: "\ue2ca",
  pencil: "\uf303",
  projects: "\uf542",
  question: FA.circleQuestion,
  route: "\uf4d7",
  search: "\uf002",
  sparkles: "\ue5d6",
  trash: "\uf1f8",
  upload: "\uf093",
  userGroup: "\uf0c0",
  wrench: "\uf0ad",
  xmark: "\uf00d",
};

export function CpIcon({
  className,
  icon,
  size = 14,
  color,
}: {
  className?: string;
  icon: string;
  size?: number;
  color?: string;
}) {
  return <FaIcon className={className} icon={icon} size={size} color={color ?? "currentColor"} />;
}

function RailButton({
  icon,
  active,
  boxed,
  badge,
  label,
  onClick,
}: {
  icon: ReactNode;
  active?: boolean;
  boxed?: boolean;
  badge?: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <CpRailButton
      active={active}
      badge={badge}
      boxed={boxed}
      className="cpv2-rail-button"
      icon={icon}
      label={label}
      onClick={onClick}
    />
  );
}

export function CpRail() {
  return (
    <aside className="cpv2-rail" aria-label="Connected Platform navigation">
      <div className="cpv2-mark" aria-hidden="true" />
      <div className="cpv2-dev">DEV</div>
      <div className="cpv2-rail-items">
        <CpNotificationsRailControl classPrefix="cpv2" />
        <RailButton icon={<CpIcon icon={CP_FA.home} size={15} />} label="Home" />
        <RailButton icon={<CpIcon icon={CP_FA.chart} size={15} />} label="Dashboard" />
        <RailButton icon={<CpIcon icon={CP_FA.projects} size={15} />} label="Projects and initiatives" active />
        <RailButton icon={<CpIcon icon={CP_FA.file} size={15} />} label="Documents" />
        <RailButton icon={<CpIcon icon={CP_FA.briefcase} size={15} />} label="Automation" />
        <RailButton icon={<CpIcon icon={CP_FA.userGroup} size={15} />} label="Teams" />
        <RailButton icon={<CpIcon icon={CP_FA.clipboard} size={15} />} label="Reports" />
        <RailButton icon={<CpIcon icon={CP_FA.sparkles} size={16} />} label="AI tools" />
      </div>
      <div className="cpv2-rail-bottom">
        <RailButton icon={<CpIcon icon={CP_FA.admin} size={14} />} label="Admin" />
        <RailButton icon={<CpIcon icon={CP_FA.question} size={14} />} label="Help" />
        <div className="cpv2-user-dot">DW</div>
      </div>
    </aside>
  );
}

export function HeaderActions() {
  return null;
}
