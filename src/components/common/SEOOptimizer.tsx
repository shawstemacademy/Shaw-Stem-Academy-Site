import React, { useEffect } from 'react';

export interface SEOOptimizerProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  activeTab?: string;
}

const TAB_METADATA_MAP: Record<string, { title: string; description: string; keywords: string }> = {
  home: {
    title: 'Shaw STEM Academy - Premium Science, Technology & Engineering Portal',
    description: 'Welcome to Shaw STEM Academy. Discover advanced engineering, physics, science, and coding curricula for students, parents, faculty, and administrators.',
    keywords: 'Shaw STEM Academy, STEM school portal, science course registration, engineering laboratory classes, coding school, academics, admissions portal',
  },
  academics: {
    title: 'Academics & Course Catalog - Shaw STEM Academy',
    description: 'Explore hands-on STEM courses, robotics tracks, computer science, and engineering curricula at Shaw STEM Academy.',
    keywords: 'Shaw STEM Academy course catalog, STEM classes, engineering labs, science courses, computer science curriculum',
  },
  student: {
    title: 'Student Portal & Class Registration - Shaw STEM Academy',
    description: 'Access active course resources, class schedules, laboratory registrations, tuition fee tracking, and announcements on the Shaw STEM Academy Student Portal.',
    keywords: 'Shaw STEM Academy student portal, class registration, student schedule, STEM lab enrollment, academic portal',
  },
  admin: {
    title: 'Administrator Dashboard - Shaw STEM Academy',
    description: 'Administrative suite for Shaw STEM Academy school management, faculty assignments, user role permissions, and course registries.',
    keywords: 'Shaw STEM Academy admin, school management dashboard, academic portal admin, student registry',
  },
  teacher: {
    title: 'Faculty Portal - Shaw STEM Academy',
    description: 'Faculty portal for managing course materials, office hours, attendance, and student rosters at Shaw STEM Academy.',
    keywords: 'Shaw STEM Academy faculty, teacher dashboard, office hours manager, course management',
  },
  privacy: {
    title: 'Privacy Policy - Shaw STEM Academy',
    description: 'Read the Privacy Policy and data governance standards for the Shaw STEM Academy online portal and Google OAuth integration.',
    keywords: 'Shaw STEM Academy privacy policy, data security, Google OAuth privacy, student data protection',
  },
  terms: {
    title: 'Terms of Service - Shaw STEM Academy',
    description: 'Terms of Service and legal agreements governing the use of the Shaw STEM Academy academic portal.',
    keywords: 'Shaw STEM Academy terms of service, portal rules, academic terms, user agreement',
  },
  login: {
    title: 'Portal Sign In - Shaw STEM Academy',
    description: 'Sign in with your Google Account to access your Shaw STEM Academy student, faculty, or administrative portal.',
    keywords: 'Shaw STEM Academy login, Google Sign-In portal, STEM portal authentication',
  },
};

export const SEOOptimizer: React.FC<SEOOptimizerProps> = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  canonicalUrl,
  activeTab = 'home',
}) => {
  useEffect(() => {
    const tabMeta = TAB_METADATA_MAP[activeTab] || TAB_METADATA_MAP.home;

    const finalTitle = title || tabMeta.title;
    const finalDescription = description || tabMeta.description;
    const finalKeywords = keywords || tabMeta.keywords;
    const finalOgTitle = ogTitle || finalTitle;
    const finalOgDescription = ogDescription || finalDescription;
    const finalCanonical = canonicalUrl || `https://www.shawstemacademy.com/${activeTab && activeTab !== 'home' ? `?tab=${activeTab}` : ''}`;

    // Update document title
    document.title = finalTitle;

    // Helper to update or create meta tag
    const updateMetaTag = (selector: string, attributeName: string, attributeValue: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to update or create link tag
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // Set meta tags
    updateMetaTag('meta[name="description"]', 'name', 'description', finalDescription);
    updateMetaTag('meta[name="keywords"]', 'name', 'keywords', finalKeywords);
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', finalOgTitle);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', finalOgDescription);
    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website');
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', finalCanonical);
    updateMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', finalOgTitle);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', finalOgDescription);

    // Set canonical link
    updateLinkTag('canonical', finalCanonical);
  }, [title, description, keywords, ogTitle, ogDescription, canonicalUrl, activeTab]);

  return null;
};
