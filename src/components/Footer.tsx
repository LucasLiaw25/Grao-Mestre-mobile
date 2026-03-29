import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { Instagram, Facebook, Twitter, Coffee } from 'lucide-react-native';

const COLORS = {
  bg: '#1c1917', // Stone 900 (Combinando com seu style Old Money)
  text: '#F5F5F5',
  muted: 'rgba(245, 245, 245, 0.6)',
  accent: '#9A5B32', // Marrom da marca
  border: 'rgba(245, 245, 245, 0.1)',
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.footer}>
      <View style={styles.container}>
        {/* Brand & Socials - Lado a Lado para economizar altura */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.brand}>Grão Mestre.</Text>
            <Text style={styles.tagline}>The art of roasting.</Text>
          </View>

          <View style={styles.socialGroup}>
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <TouchableOpacity key={i} style={styles.socialBtn}>
                <Icon size={20} color={COLORS.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Links Rápidos - Grid de 2 colunas para ser compacto */}
        <View style={styles.linkGrid}>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Shop</Text>
            {['All Products', 'Single Origin', 'Blends'].map((item) => (
              <TouchableOpacity key={item} style={styles.linkItem}>
                <Text style={styles.linkText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.column}>
            <Text style={styles.columnTitle}>Company</Text>
            {['Our Story', 'Sustainability', 'Contact'].map((item) => (
              <TouchableOpacity key={item} style={styles.linkItem}>
                <Text style={styles.linkText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Section - Minimalista */}
        <View style={styles.bottomBar}>
          <Text style={styles.copyright}>
            © {currentYear} Grão Mestre
          </Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity><Text style={styles.legalText}>Privacy</Text></TouchableOpacity>
            <View style={styles.dot} />
            <TouchableOpacity><Text style={styles.legalText}>Terms</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: COLORS.bg,
    paddingTop: 40,
    paddingBottom: 24,
  },
  container: {
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brand: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tagline: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  socialGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  divider: {
    backgroundColor: COLORS.border,
    height: 1,
    marginBottom: 24,
  },
  linkGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  linkItem: {
    paddingVertical: 6,
  },
  linkText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  copyright: {
    fontSize: 12,
    color: COLORS.muted,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalText: {
    fontSize: 12,
    color: COLORS.muted,
    textDecorationLine: 'underline',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  }
});