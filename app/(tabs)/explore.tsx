import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Searchbar, Surface, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/src/lib/api';
import { CategoryResponseDTO } from '@/src/types';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  // Busca as categorias reais do seu banco MySQL via Spring Boot
  const { data: categories, isLoading } = useQuery<CategoryResponseDTO[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesApi.getAll();
      // O Spring Boot pode retornar uma lista pura ou um objeto Pageable (content)
      const data = response.data as any;
      return data.content || data;
    },
  });

  // Filtro simples local para a busca
  const filteredCategories = categories?.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCategory = ({ item }: { item: CategoryResponseDTO }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => {
        // Futura integração: navegar para lista de produtos filtrada
        console.log(`Filtrar por: ${item.name}`);
      }}
    >
      <Surface style={styles.iconWrapper} elevation={1}>
        {/* Usamos a primeira letra do nome como ícone caso não haja um mapeamento */}
        <Avatar.Text 
          size={48} 
          label={item.name.substring(0, 1).toUpperCase()} 
          style={styles.avatar}
          labelStyle={styles.avatarLabel}
        />
      </Surface>
      <Text variant="titleMedium" style={styles.categoryName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text variant="bodySmall" style={styles.categoryDesc} numberOfLines={2}>
        {item.description || "Explorar coleção"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Descobrir</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Navegue pelas seleções exclusivas do Grão Mestre.
        </Text>
      </View>

      <Searchbar
        placeholder="O que você procura?"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        elevation={1}
      />

      {isLoading ? (
        <ActivityIndicator animating={true} color="#292524" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma categoria encontrada.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  header: { paddingHorizontal: 20, marginTop: 60, marginBottom: 20 },
  title: { fontFamily: 'serif', fontWeight: 'bold', color: '#1c1917' },
  subtitle: { color: '#78716c', marginTop: 4 },
  searchBar: { marginHorizontal: 20, marginBottom: 25, backgroundColor: '#ffffff', borderRadius: 12 },
  loader: { marginTop: 50 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between' },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  iconWrapper: { borderRadius: 25, marginBottom: 12, backgroundColor: '#f5f5f4' },
  avatar: { backgroundColor: '#292524' },
  avatarLabel: { fontWeight: 'bold', color: '#ffffff' },
  categoryName: { fontWeight: 'bold', color: '#1c1917', textAlign: 'center' },
  categoryDesc: { color: '#a8a29e', fontSize: 11, textAlign: 'center', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#a8a29e', marginTop: 40, fontFamily: 'serif' }
});