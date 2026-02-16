/**
 * Feature Brief PDF Template
 * Story 3.1: Professional PDF generation using @react-pdf/renderer
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { FeatureBrief } from '@/lib/bmad/types';

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  // Header Styles
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2C2416',
    borderBottom: '3px solid #C4785C',
    paddingBottom: 10,
  },
  meta: {
    fontSize: 10,
    color: '#6B7B8C',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  // Section Styles
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A3D2E',
    marginBottom: 10,
    borderBottom: '1px solid #F5F0E6',
    paddingBottom: 6,
  },
  text: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#333333',
    marginBottom: 8,
  },
  // Priority Context Box
  priorityBox: {
    backgroundColor: '#FAF7F2',
    borderLeft: '4px solid #C4785C',
    padding: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  priorityRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  priorityLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B56A4E',
    width: 120,
  },
  priorityValue: {
    fontSize: 11,
    color: '#2C2416',
  },
  priorityBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // List Styles
  list: {
    marginLeft: 0,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  listBullet: {
    fontSize: 11,
    width: 20,
    fontWeight: 'bold',
    color: '#C4785C',
  },
  listText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 1.5,
    color: '#333333',
  },
  // Footer Styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTop: '1px solid #F5F0E6',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 9,
    color: '#6B7B8C',
    marginBottom: 4,
  },
  // Page Number
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 20,
    right: 40,
    color: '#6B7B8C',
  },
  // Branding (optional custom logo space)
  brandingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: '1px solid #F5F0E6',
  },
  brandingText: {
    fontSize: 10,
    color: '#C4785C',
    fontWeight: 'bold',
  },
});

interface FeatureBriefPDFProps {
  brief: FeatureBrief;
  branding?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

/**
 * Main PDF Document Component
 */
export default function FeatureBriefPDF({ brief, branding }: FeatureBriefPDFProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'critical':
        return '#8B4D3B';
      case 'high':
        return '#C4785C';
      case 'medium':
        return '#D4A84B';
      case 'low':
        return '#6B7B8C';
      default:
        return '#6B7B8C';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Optional Branding Header */}
        {branding && (
          <View style={styles.brandingSection}>
            <Text style={styles.brandingText}>
              {branding.companyName || 'ThinkHaven'}
            </Text>
            <Text style={styles.brandingText}>Feature Brief</Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{brief.title}</Text>

        {/* Meta Information */}
        <Text style={styles.meta}>
          Generated on {formatDate(brief.generatedAt)}
        </Text>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.text}>{brief.description}</Text>
        </View>

        {/* Priority Context Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority Context</Text>
          <View style={styles.priorityBox}>
            <View style={styles.priorityRow}>
              <Text style={styles.priorityLabel}>Priority Score:</Text>
              <Text style={styles.priorityValue}>
                {brief.priorityContext.score.toFixed(2)}
              </Text>
            </View>
            <View style={styles.priorityRow}>
              <Text style={styles.priorityLabel}>Category:</Text>
              <Text
                style={[
                  styles.priorityValue,
                  { color: getCategoryColor(brief.priorityContext.category) },
                ]}
              >
                {brief.priorityContext.category}
              </Text>
            </View>
            <View style={styles.priorityRow}>
              <Text style={styles.priorityLabel}>Quadrant:</Text>
              <Text style={styles.priorityValue}>
                {brief.priorityContext.quadrant}
              </Text>
            </View>
          </View>
        </View>

        {/* User Stories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Stories</Text>
          <View style={styles.list}>
            {brief.userStories.map((story, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>{index + 1}.</Text>
                <Text style={styles.listText}>{story}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Acceptance Criteria Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceptance Criteria</Text>
          <View style={styles.list}>
            {brief.acceptanceCriteria.map((ac, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>{index + 1}.</Text>
                <Text style={styles.listText}>{ac}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Success Metrics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Success Metrics</Text>
          <View style={styles.list}>
            {brief.successMetrics.map((metric, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>{index + 1}.</Text>
                <Text style={styles.listText}>{metric}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Implementation Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Implementation Notes</Text>
          <View style={styles.list}>
            {brief.implementationNotes.map((note, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>{index + 1}.</Text>
                <Text style={styles.listText}>{note}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Feature Brief v{brief.version} | Last Edited:{' '}
            {formatDate(brief.lastEditedAt)}
          </Text>
          <Text style={styles.footerText}>
            Generated with BMad Method Feature Refinement Pathway
          </Text>
          {branding?.companyName && (
            <Text style={styles.footerText}>
              {branding.companyName} | Powered by ThinkHaven
            </Text>
          )}
        </View>

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
