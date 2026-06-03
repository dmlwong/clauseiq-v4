import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import { Button, FA, FaIcon, IconButton, TabButton } from "@orbit";
import { CpRailButton } from "@/components/prototype-cp-shared/orbit";

type CpNotificationClassPrefix = "cp" | "cpv2";
type NotificationSource = "Connected Platform" | "Efficio Hub";
type NotificationFilter = "All" | "Unread" | NotificationSource;
type NotificationKind = "contract" | "deadline";

type CpNotification = {
  id: string;
  source: NotificationSource;
  kind: NotificationKind;
  message: string;
  timeAgo: string;
  unread: boolean;
};

const CP_NOTIFICATION_FA = {
  bell: "\uf0f3",
  check: FA.check,
  file: FA.file,
  gear: "\uf013",
  xmark: "\uf00d",
};

const NOTIFICATION_FILTERS: NotificationFilter[] = ["All", "Unread", "Connected Platform", "Efficio Hub"];

const INITIAL_NOTIFICATIONS: CpNotification[] = [
  {
    id: "contract-reviewed-19h",
    source: "Connected Platform",
    kind: "contract",
    message: "Your contract has now been reviewed. Click here to download.",
    timeAgo: "19 hours ago",
    unread: true,
  },
  {
    id: "initiative-complete-2d",
    source: "Connected Platform",
    kind: "deadline",
    message:
      "The deadline for milestone Initiative Complete. in the YRK22-1044 | InitiativeToCheckMarketIQPart05 initiative has passed, and no action has been taken.",
    timeAgo: "2 days ago",
    unread: true,
  },
  {
    id: "initiative-in-flight-5d",
    source: "Connected Platform",
    kind: "deadline",
    message:
      "The deadline for milestone Initiative In-Flight. in the YRK22-1044 | InitiativeToCheckMarketIQPart05 initiative has passed, and no action has been taken.",
    timeAgo: "5 days ago",
    unread: true,
  },
  {
    id: "contract-reviewed-6d",
    source: "Efficio Hub",
    kind: "contract",
    message: "Your contract has now been reviewed. Click here to download.",
    timeAgo: "6 days ago",
    unread: false,
  },
  {
    id: "initiative-complete-7d",
    source: "Connected Platform",
    kind: "deadline",
    message:
      "The deadline for milestone Initiative Complete. in the YRK22-1044 | InitiativeToCheckMarketIQPart05 initiative has passed, and no action has been taken.",
    timeAgo: "7 days ago",
    unread: false,
  },
  {
    id: "contract-reviewed-9d",
    source: "Efficio Hub",
    kind: "contract",
    message: "Your contract has now been reviewed. Click here to download.",
    timeAgo: "9 days ago",
    unread: false,
  },
];

function NotificationGlyph({ classPrefix, kind }: { classPrefix: CpNotificationClassPrefix; kind: NotificationKind }) {
  return (
    <span
      className={`${classPrefix}-notification-glyph ${kind === "contract" ? "is-contract" : "is-deadline"}`}
      aria-hidden="true"
    >
      <FaIcon icon={kind === "contract" ? CP_NOTIFICATION_FA.file : CP_NOTIFICATION_FA.bell} size={17} />
      {kind === "contract" ? (
        <span className={`${classPrefix}-notification-glyph-check`}>
          <FaIcon icon={CP_NOTIFICATION_FA.check} size={7} />
        </span>
      ) : null}
    </span>
  );
}

function CpNotificationsPanel({
  classPrefix,
  notifications,
  filter,
  hasUnread,
  panelRef,
  onDismiss,
  onFilterChange,
  onMarkAllAsRead,
}: {
  classPrefix: CpNotificationClassPrefix;
  notifications: CpNotification[];
  filter: NotificationFilter;
  hasUnread: boolean;
  panelRef: RefObject<HTMLDivElement>;
  onDismiss: (id: string) => void;
  onFilterChange: (filter: NotificationFilter) => void;
  onMarkAllAsRead: () => void;
}) {
  const panelId = `${classPrefix}-notifications-panel`;

  return (
    <section
      ref={panelRef}
      className={`${classPrefix}-notifications-panel`}
      id={panelId}
      role="dialog"
      aria-label="Notifications"
    >
      <header className={`${classPrefix}-notifications-header`}>
        <div className={`${classPrefix}-notifications-title-group`}>
          <h2>Notifications</h2>
          <IconButton
            className={`${classPrefix}-notifications-settings`}
            variant="Tertiary"
            size="Small"
            ariaLabel="Notification settings"
            icon={<FaIcon icon={CP_NOTIFICATION_FA.gear} size={14} />}
          />
        </div>
        <Button
          className={`${classPrefix}-notifications-mark-read`}
          variant="Tertiary"
          size="Small"
          onClick={onMarkAllAsRead}
          disabled={!hasUnread}
        >
          Mark all as read
        </Button>
      </header>
      <div className={`${classPrefix}-notifications-tabs`} role="tablist" aria-label="Notification filters">
        {NOTIFICATION_FILTERS.map((option) => (
          <TabButton
            key={option}
            className={`${classPrefix}-notifications-tab${filter === option ? " is-active" : ""}`}
            active={filter === option}
            showUnderline={false}
            ariaControls={panelId}
            onClick={() => onFilterChange(option)}
          >
            {option}
          </TabButton>
        ))}
      </div>
      <div className={`${classPrefix}-notifications-list`} role="list">
        {notifications.length ? (
          notifications.map((notification) => (
            <article
              className={`${classPrefix}-notification-item${notification.unread ? " is-unread" : ""}`}
              key={notification.id}
              role="listitem"
            >
              <NotificationGlyph classPrefix={classPrefix} kind={notification.kind} />
              <div className={`${classPrefix}-notification-copy`}>
                <p>{notification.message}</p>
                <span>{notification.timeAgo}</span>
              </div>
              <IconButton
                className={`${classPrefix}-notification-dismiss`}
                variant="Tertiary"
                size="Small"
                ariaLabel={`Dismiss notification from ${notification.timeAgo}`}
                icon={<FaIcon icon={CP_NOTIFICATION_FA.xmark} size={13} />}
                onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  onDismiss(notification.id);
                }}
              />
            </article>
          ))
        ) : (
          <div className={`${classPrefix}-notifications-empty`} role="status">
            No notifications to show
          </div>
        )}
      </div>
    </section>
  );
}

export function CpNotificationsRailControl({ classPrefix }: { classPrefix: CpNotificationClassPrefix }) {
  const [notifications, setNotifications] = useState<CpNotification[]>(INITIAL_NOTIFICATIONS);
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>("All");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const panelId = `${classPrefix}-notifications-panel`;
  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const filteredNotifications = useMemo(() => {
    if (notificationFilter === "Unread") {
      return notifications.filter((notification) => notification.unread);
    }

    if (notificationFilter === "Connected Platform" || notificationFilter === "Efficio Hub") {
      return notifications.filter((notification) => notification.source === notificationFilter);
    }

    return notifications;
  }, [notificationFilter, notifications]);

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (panelRef.current?.contains(target) || notificationButtonRef.current?.contains(target)) {
        return;
      }

      setNotificationsOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [notificationsOpen]);

  return (
    <>
      <CpRailButton
        ref={notificationButtonRef}
        active={notificationsOpen}
        boxed
        badge={unreadCount ? String(unreadCount) : undefined}
        className={`${classPrefix}-rail-button`}
        icon={<FaIcon icon={CP_NOTIFICATION_FA.bell} size={15} />}
        label="Notifications"
        aria-controls={panelId}
        aria-expanded={notificationsOpen}
        onClick={() => setNotificationsOpen((isOpen) => !isOpen)}
      />
      {notificationsOpen ? (
        <CpNotificationsPanel
          classPrefix={classPrefix}
          notifications={filteredNotifications}
          filter={notificationFilter}
          hasUnread={unreadCount > 0}
          panelRef={panelRef}
          onDismiss={(id) => setNotifications((current) => current.filter((notification) => notification.id !== id))}
          onFilterChange={setNotificationFilter}
          onMarkAllAsRead={() =>
            setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })))
          }
        />
      ) : null}
    </>
  );
}
