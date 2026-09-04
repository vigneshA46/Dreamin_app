import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

import { apiRequest } from '../../services/api';

// Keep this in sync with your AppNavigator.jsx
const BASE_TAB_BAR_HEIGHT = 75;

const COLORS = {
  navy: '#0F1B3D',
  navyCard: '#101B3D',
  blue: '#2F6FED',
  green: '#22C55E',
  red: '#EF4444',
  textDark: '#0F1B2A',
  textGray: '#8A93A6',
  bg: '#F5F6FA',
  cardBg: '#FFFFFF',
  border: '#ECEEF3',
};

// Pastel card themes, cycled per tutorial
const CARD_THEMES = [
  { bg: '#DCE7FF', accent: '#2F6FED' },
  { bg: '#E5DDFB', accent: '#7C3AED' },
  { bg: '#D9F5E5', accent: '#16A34A' },
  { bg: '#FFE9D6', accent: '#EA580C' },
  { bg: '#FFDADA', accent: '#DC2626' },
  { bg: '#D6F0FA', accent: '#0891B2' },
];

const ALL_CATEGORY = 'All';

function normalizeTutorials(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.tutorials)) return response.tutorials;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function getYouTubeId(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '');
    }

    return parsed.searchParams.get('v');
  } catch {
    return null;
  }
}

async function openVideo(url) {
  if (!url) {
    Alert.alert('Video unavailable', 'This tutorial has no video link.');
    return;
  }

  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error('Error opening video:', error);
    Alert.alert('Unable to open', 'Please try again later.');
  }
}

export default function Tutorials({ navigation }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = BASE_TAB_BAR_HEIGHT + insets.bottom;

  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORY);

  const fetchTutorials = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await apiRequest('GET', '/api/tutorials');

      setTutorials(normalizeTutorials(res));
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      setTutorials([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, []);

  // Categories derived from API data when available
  const categories = useMemo(() => {
    const unique = new Set();

    tutorials.forEach((tut) => {
      if (tut?.category) unique.add(String(tut.category));
    });

    return [ALL_CATEGORY, ...Array.from(unique)];
  }, [tutorials]);

  const filteredTutorials = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tutorials.filter((tut) => {
      const matchesCategory =
        category === ALL_CATEGORY ||
        String(tut?.category || '') === category;

      const matchesSearch =
        !query || String(tut?.title || '').toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [tutorials, search, category]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation?.goBack?.()}
          hitSlop={8}
        >
          <View style={styles.backCircle}>
            <Feather name="chevron-left" size={20} color={COLORS.textDark} />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Tutorials</Text>

        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => fetchTutorials(true)}
          hitSlop={8}
        >
          <Feather name="refresh-cw" size={18} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTutorials(true)}
            tintColor={COLORS.blue}
          />
        }
      >
        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={COLORS.textGray} />

          <TextInput
            style={styles.searchInput}
            placeholder="Search tutorials..."
            placeholderTextColor={COLORS.textGray}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Feather name="x" size={16} color={COLORS.textGray} />
            </TouchableOpacity>
          )}
        </View>

        {/* CATEGORIES */}
        {categories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {categories.map((item) => {
              const active = item === category;

              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(item)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* LOADING */}
        {loading && (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color={COLORS.blue} />
            <Text style={styles.loadingText}>Loading tutorials...</Text>
          </View>
        )}

        {/* EMPTY */}
        {!loading && filteredTutorials.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Feather name="play-circle" size={26} color={COLORS.textGray} />
            </View>

            <Text style={styles.emptyTitle}>
              {search ? 'No matching tutorials' : 'No tutorials yet'}
            </Text>

            <Text style={styles.emptyText}>
              {search
                ? 'Try a different search term or category.'
                : 'Tutorials will appear here once they are published.'}
            </Text>
          </View>
        )}

        {/* TUTORIAL CARDS */}
        {!loading &&
          filteredTutorials.map((tut, index) => {
            const theme = CARD_THEMES[index % CARD_THEMES.length];
            const videoId = getYouTubeId(tut?.url);

            return (
              <TouchableOpacity
                key={tut?.id ?? videoId ?? index}
                style={[styles.tutorialCard, { backgroundColor: theme.bg }]}
                activeOpacity={0.8}
                onPress={() => openVideo(tut?.url)}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.titleChip}>
                    <Text style={styles.titleChipText} numberOfLines={1}>
                      {tut?.title || 'Untitled'}
                    </Text>
                  </View>

                  {tut?.duration ? (
                    <View style={styles.durationChip}>
                      <Feather name="clock" size={10} color="#FFFFFF" />
                      <Text style={styles.durationText}>{tut.duration}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.playWrapper}>
                  <View style={styles.playButton}>
                    <Feather name="play" size={20} color={theme.accent} />
                  </View>
                </View>

                {tut?.category ? (
                  <Text style={[styles.cardCategory, { color: theme.accent }]}>
                    {tut.category}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  headerIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  scrollContent: {
    paddingHorizontal: 20,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    paddingVertical: 0,
  },

  chipRow: {
    gap: 8,
    paddingBottom: 16,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  chipActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },

  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },

  chipTextActive: {
    color: '#FFFFFF',
  },

  tutorialCard: {
    borderRadius: 16,
    padding: 12,
    minHeight: 110,
    marginBottom: 12,
    justifyContent: 'space-between',
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  titleChip: {
    flexShrink: 1,
    maxWidth: '70%',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  titleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,27,42,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  durationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  playWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },

  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },

  cardCategory: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  centerLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.textGray,
  },

  emptyCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 5,
  },

  emptyText: {
    fontSize: 11,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: 17,
  },
});