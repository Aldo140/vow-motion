"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ListIcon, XIcon } from "@phosphor-icons/react";
import { Arrow, Brand } from "./ui";
import { useHydrated } from "./use-hydrated";

const links = [
  { href: "#worlds", label: "The design collection" },
  { href: "#experience", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "/planners", label: "For planners" },
];

export default function MarketingNavigation({
  homeLinks = false,
}: {
  homeLinks?: boolean;
}) {
  const navigationLinks = [
    ...links,
    { href: "/contact", label: "Contact" },
  ].map((link) => ({
    ...link,
    href: homeLinks && link.href.startsWith("#") ? "/" + link.href : link.href,
  }));
  const ready = useHydrated();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const unlock = useRef<(() => void) | null>(null);
  const backdropPress = useRef(false);

  const closeMenu = useCallback((restoreFocus = true) => {
    dialog.current?.close();
    unlock.current?.();
    unlock.current = null;
    setOpen(false);
    if (restoreFocus) toggle.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const onResize = () => {
      if (desktop.matches && dialog.current?.open) {
        closeMenu(false);
        header.current?.querySelector("a")?.focus({ preventScroll: true });
      }
    };
    desktop.addEventListener("change", onResize);
    return () => {
      desktop.removeEventListener("change", onResize);
      unlock.current?.();
      unlock.current = null;
    };
  }, [closeMenu]);

  function openMenu(animate: boolean) {
    const element = dialog.current;
    if (!element || element.open) return;

    // Fixed positioning also prevents background touch scrolling in iOS Safari.
    const { scrollX, scrollY } = window;
    const style = document.body.style;
    const previous = {
      position: style.position,
      top: style.top,
      left: style.left,
      width: style.width,
      overflow: style.overflow,
    };
    Object.assign(style, {
      position: "fixed",
      top: `-${scrollY}px`,
      left: `-${scrollX}px`,
      width: "100%",
      overflow: "hidden",
    });
    unlock.current = () => {
      Object.assign(style, previous);
      window.scrollTo({ top: scrollY, left: scrollX, behavior: "instant" });
    };
    element.dataset.animate = String(animate);
    element.showModal();
    closeButton.current?.focus({ preventScroll: true });
    setOpen(true);
  }

  return (
    <>
      <header className="marketing-nav" ref={header}>
        <Brand />
        <nav aria-label="Main navigation">
          {navigationLinks.map(({ href, label }) => (
            <a key={href} href={href}>
              {label}
              {href === "/planners" && <Arrow diagonal size={13} />}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <a href="/login" className="signin">
            Sign in
          </a>
          <a href="/start" className="button primary small">
            Begin your story <Arrow diagonal size={15} />
          </a>
        </div>
        <button
          ref={toggle}
          type="button"
          className="mobile-toggle icon-button marketing-menu-toggle"
          onClick={(event) => openMenu(event.detail !== 0)}
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="dialog"
          aria-label="Open menu"
          disabled={!ready}
        >
          <ListIcon size={24} aria-hidden="true" />
        </button>
      </header>

      <dialog
        ref={dialog}
        id={menuId}
        className="marketing-menu"
        aria-label="Explore Vow Motion"
        onCancel={(event) => {
          event.preventDefault();
          closeMenu();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls =
            event.currentTarget.querySelectorAll<HTMLElement>(
              "a[href], button",
            );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => {
          // Native close events can arrive after a rapid reopen.
          if (!dialog.current?.open) {
            unlock.current?.();
            unlock.current = null;
            setOpen(false);
          }
        }}
        onPointerDown={(event) => {
          backdropPress.current = event.target === event.currentTarget;
        }}
        onClick={(event) => {
          if (backdropPress.current && event.target === event.currentTarget) {
            closeMenu();
          }
          backdropPress.current = false;
        }}
      >
        <div className="marketing-menu-sheet">
          <div className="marketing-menu-heading">
            <Brand
              onClick={(event) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                closeMenu(false);
                header.current
                  ?.querySelector("a")
                  ?.focus({ preventScroll: true });
              }}
            />
            <button
              type="button"
              ref={closeButton}
              className="marketing-menu-close"
              aria-label="Close menu"
              onClick={() => closeMenu()}
            >
              <span>Close</span>
              <XIcon size={23} aria-hidden="true" />
            </button>
          </div>
          <nav className="marketing-menu-links" aria-label="Mobile navigation">
            <p className="marketing-menu-caption">
              A beautiful place to begin.
            </p>
            {navigationLinks.map(({ href, label }, index) => (
              <a
                href={href}
                key={href}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  closeMenu(false);
                  // Let the native anchor update history and scroll; move keyboard
                  // focus to the destination after the modal releases the page.
                  // A page link navigates instead, and carries its own focus.
                  if (href.startsWith("#"))
                    document
                      .getElementById(href.slice(1))
                      ?.focus({ preventScroll: true });
                }}
              >
                <span className="marketing-menu-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <span>{label}</span>
                <Arrow size={19} />
              </a>
            ))}
          </nav>
          <div className="marketing-menu-footer">
            <a
              href="/start"
              className="button primary"
              onClick={() => closeMenu(false)}
            >
              Begin your story <Arrow diagonal size={18} />
            </a>
            <div>
              <span>Already making plans?</span>
              <a href="/login" onClick={() => closeMenu(false)}>
                Sign in <Arrow size={15} />
              </a>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
