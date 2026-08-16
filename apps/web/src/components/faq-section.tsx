"use client";

import * as React from "react";
import { useState } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useScopedI18n } from "@/locales/client";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md p-1 text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border data-[state=active]:text-foreground",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

const FAQAccordion: React.FC<FAQAccordionProps> = ({ items }) => (
  <div className="">
    <Accordion type="single" collapsible className="w-full">
      {items.map((faq, index) => (
        <AccordionItem key={index} value={index.toString()}>
          <AccordionTrigger className="text-left hover:no-underline">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);

export const LandingFAQSection = () => {
  const t = useScopedI18n("landing");

  const FAQ_SECTIONS: FAQItem[] = [
    {
      question: t("faq.questions.how_prevents.question"),
      answer: t("faq.questions.how_prevents.answer"),
    },
    {
      question: t("faq.questions.what_detections.question"),
      answer: t("faq.questions.what_detections.answer"),
    },
    {
      question: t("faq.questions.slow_server.question"),
      answer: t("faq.questions.slow_server.answer"),
    },
    {
      question: t("faq.questions.easy_install.question"),
      answer: t("faq.questions.easy_install.answer"),
    },
    {
      question: t("faq.questions.bypass.question"),
      answer: t("faq.questions.bypass.answer"),
    },
    {
      question: t("faq.questions.works_scripts.question"),
      answer: t("faq.questions.works_scripts.answer"),
    },
    {
      question: t("faq.questions.free_trial.question"),
      answer: t("faq.questions.free_trial.answer"),
    },
    {
      question: t("faq.questions.after_buying.question"),
      answer: t("faq.questions.after_buying.answer"),
    },
    {
      question: t("faq.questions.multiple_servers.question"),
      answer: t("faq.questions.multiple_servers.answer"),
    },
  ]

  return (
    <section id="faqs" className="container mx-auto py-16 md:py-24 px-4 md:px-6 max-w-4xl">
      <header className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {t("faq.title")}
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("faq.subtitle")}
        </p>
      </header>

      <FAQAccordion
        items={FAQ_SECTIONS}
      />
    </section>
  );
};