"use client";

import { useEffect } from "react";
import {
  classifyGtmClick,
  configureGtmEventContext,
  pushGtmEvent,
  safeGtmLinkDestination,
} from "@/lib/google-tag-manager-events";

function elementLabel(element: HTMLElement): string {
  return (
    element.dataset.gtmLabel ||
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.textContent ||
    element.tagName.toLowerCase()
  ).replace(/\s+/g, " ").trim().slice(0, 160);
}

function elementLocation(element: HTMLElement): string {
  const managedSection = element.closest<HTMLElement>("[data-managed-section]");
  if (managedSection?.dataset.managedSection) return managedSection.dataset.managedSection;
  const labelledSection = element.closest<HTMLElement>("section[aria-label], aside[aria-label]");
  if (labelledSection) return labelledSection.getAttribute("aria-label") || "page";
  const footer = element.closest("footer");
  if (footer) return "footer";
  const header = element.closest("header");
  if (header) return "header";
  return "page";
}

function formContext(form: HTMLFormElement) {
  const intent = form.elements.namedItem("intent");
  const intentId = intent instanceof HTMLInputElement ? intent.value : "contact";
  return {
    form_id: form.dataset.gtmFormId || intentId || form.id || "contact",
    form_name: form.dataset.gtmFormName || form.getAttribute("aria-label") || intentId || "Contact form",
    form_location: form.dataset.gtmFormLocation || elementLocation(form),
    form_key: form.dataset.gtmFormKey || undefined,
  };
}

export function GtmInteractionTracker({ projectName }: { projectName: string }) {
  useEffect(() => {
    configureGtmEventContext(projectName);

    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("a, button, [role='button']");
      if (!element || element.dataset.gtmIgnore === "true" || element.getAttribute("aria-disabled") === "true") return;
      if (element instanceof HTMLButtonElement && element.disabled) return;

      const href = element instanceof HTMLAnchorElement ? element.getAttribute("href") || "" : "";
      const eventName = classifyGtmClick(href, element.dataset.gtmEvent);
      pushGtmEvent(eventName, {
        button_id: element.dataset.gtmId || element.id || undefined,
        button_label: elementLabel(element),
        button_location: element.dataset.gtmSection || elementLocation(element),
        link_destination: safeGtmLinkDestination(href),
        form_key: element.dataset.gtmFormKey || undefined,
      });
    };

    const onSubmit = (event: SubmitEvent) => {
      if (!(event.target instanceof HTMLFormElement)) return;
      pushGtmEvent("form_submit_attempt", formContext(event.target));
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, [projectName]);

  return null;
}
