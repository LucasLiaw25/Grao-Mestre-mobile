import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';

export function Footer() {
  const { width } = useWindowDimensions(); 
  const isLargeScreen = width >= 768; 
  const handleLinkPress = (path: string) => {
    console.log(`Navegando para: ${path}`);
  };

  return (
    <View style={styles.footer}>
      <View style={[styles.container, !isLargeScreen && styles.containerMobile]}>
        <View style={[styles.grid, !isLargeScreen && styles.gridMobile]}>
          <View style={[styles.brandSection, isLargeScreen && styles.brandSectionLarge]}>
            <Text style={styles.brandTitle}>Grão Mestre.</Text>
            <Text style={styles.brandDescription}>
              Elevating the daily ritual. We source, roast, and deliver the world's most extraordinary coffees, directly to your door.
            </Text>
          </View>
          <View style={[styles.sectionColumn, !isLargeScreen && styles.sectionColumnMobile]}>
            <Text style={styles.sectionTitle}>Shop</Text>
            <View style={styles.list}>
              <TouchableOpacity onPress={() => handleLinkPress("/products")} style={styles.listItem}>
                <Text style={styles.linkText}>All Products</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleLinkPress("/products")} style={styles.listItem}>
                <Text style={styles.linkText}>Single Origin</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleLinkPress("/products")} style={styles.listItem}>
                <Text style={styles.linkText}>Blends</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.sectionColumn, !isLargeScreen && styles.sectionColumnMobile]}>
            <Text style={styles.sectionTitle}>Company</Text>
            <View style={styles.list}>
              <TouchableOpacity onPress={() => handleLinkPress("/our-story")} style={styles.listItem}>
                <Text style={styles.linkText}>Our Story</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleLinkPress("/sustainability")} style={styles.listItem}>
                <Text style={styles.linkText}>Sustainability</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleLinkPress("/contact")} style={styles.listItem}>
                <Text style={styles.linkText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={[styles.bottomSection, isLargeScreen && styles.bottomSectionLarge]}>
          <Text style={styles.copyrightText}>
            © {new Date().getFullYear()} Grão Mestre. All rights reserved.
          </Text>
          <View style={styles.bottomLinks}>
            <TouchableOpacity onPress={() => handleLinkPress("/privacy-policy")}>
              <Text style={styles.bottomLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleLinkPress("/terms-of-service")}>
              <Text style={styles.bottomLinkText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#333333', 
    paddingTop: 80, 
    paddingBottom: 40, 
  },
  container: {
    marginHorizontal: 'auto',
    paddingHorizontal: 16,
  },
  containerMobile: {
    paddingHorizontal: 24, 
  },
  grid: {
    flexDirection: 'column',
    marginBottom: 64,
  },
  gridMobile: {
  },
  brandSection: {
    marginBottom: 32, 
  },
  brandSectionLarge: {
    width: '48%', 
    marginBottom: 0, 
  },
  brandTitle: {
    fontFamily: 'serif',
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: -0.5, 
    marginBottom: 24, 
    color: '#F5F5F5', 
  },
  brandDescription: {
    color: 'rgba(245, 245, 245, 0.7)', 
    maxWidth: 250,
    lineHeight: 24, 
    fontSize: 16,
  },
  sectionColumn: {
    marginBottom: 20, 
  },
  sectionColumnMobile: {
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600', 
    letterSpacing: 1, 
    textTransform: 'uppercase',
    marginBottom: 24, 
    color: '#FFD700', 
  },
  list: {
  },
  listItem: {
    paddingVertical: 8,
  },
  linkText: {
    color: 'rgba(245, 245, 245, 0.7)',
    fontSize: 16,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 245, 245, 0.1)', 
    paddingTop: 32,
    flexDirection: 'column', 
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16, 
  },
  bottomSectionLarge: {
    flexDirection: 'row', 
  },
  copyrightText: {
    fontSize: 14, 
    color: 'rgba(245, 245, 245, 0.5)', 
  },
  bottomLinks: {
    flexDirection: 'row',
    gap: 24, 
    fontSize: 14,
  },
  bottomLinkText: {
    color: 'rgba(245, 245, 0.5)',
  },
});