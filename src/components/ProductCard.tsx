import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { useNavigation } from '@react-navigation/native'; // Descomente se estiver usando React Navigation
import { formatCurrency } from "../lib/format"; // Ajuste o caminho
import type { ProductResponseDTO } from "../types"; // Ajuste o caminho

interface ProductCardProps {
  product: ProductResponseDTO;
  index: number; // Mantido caso você queira usar para alguma animação ou lógica futura
}

export function ProductCard({ product, index }: ProductCardProps) {
  // const navigation = useNavigation(); // Descomente se estiver usando React Navigation

  const handleProductPress = () => {
    console.log(`Navegando para detalhes do produto: ${product.id}`);
    // navigation.navigate('ProductDetails', { productId: product.id }); // Exemplo de navegação
  };

  return (
    <TouchableOpacity onPress={handleProductPress} style={styles.cardContainer} activeOpacity={0.8}>
      <View style={styles.imageWrapper}>
        {product.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {product.category.name}
            </Text>
          </View>
        )}
        <Image
          source={{ uri: product.imageUrl }}
          alt={product.name}
          style={styles.productImage}
        />
        <View style={styles.imageOverlay} />
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.productName}>
          {product.name}
        </Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {product.description}
        </Text>
        <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 24, // Espaçamento entre os cards
    backgroundColor: '#FFFFFF', // Cor de fundo do card
    borderRadius: 16, // rounded-2xl
    overflow: 'hidden', // Para garantir que a imagem e bordas se encaixem
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Sombra para Android
  },
  imageWrapper: {
    aspectRatio: 3 / 4, // aspect-[3/4]
    overflow: 'hidden',
    marginBottom: 16, // mb-5
    position: 'relative',
  },
  categoryBadge: {
    position: 'absolute',
    top: 16, // top-4
    left: 16, // left-4
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // bg-background/90
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 12, // px-3
    paddingVertical: 6, // py-1.5
  },
  categoryText: {
    fontSize: 10, // text-xs
    fontWeight: '600', 
    color: '#333333', 
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', 
  },
  imageOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', 
    opacity: 0, 
  },
  detailsContainer: {
    paddingHorizontal: 16, // px-4
    paddingBottom: 16, // pb-4
    // space-y-2
  },
  productName: {
    fontFamily: 'serif',
    fontSize: 20, // text-xl
    fontWeight: 'bold',
    color: '#333333', 
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14, 
    color: '#6B7280', 
    lineHeight: 20,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18, 
    fontWeight: '600',
    color: '#6B4F4F',
  },
});