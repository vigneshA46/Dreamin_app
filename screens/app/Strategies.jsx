import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  FlatList,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
  Alert,
} from 'react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

import DeploymentSuccess from './Deploymentsuccess';
import { apiRequest } from '../../services/api';


const BASE_TAB_BAR_HEIGHT =
  Platform.OS === 'ios' ? 60 : 54;


const COLORS = {
  navy: '#0F1B3D',
  blue: '#2F6FED',
  green: '#22C55E',
  orange: '#F59E0B',
  red: '#EF4444',
  textDark: '#0F1B2A',
  textGray: '#8A93A6',
  bg: '#F5F6FA',
  cardBg: '#FFFFFF',
  border: '#ECEEF3',
  overlay: 'rgba(15,27,42,0.5)',
};


const MULTIPLIERS = Array.from(
  { length: 20 },
  (_, i) => `${i + 1}x`
);

const DEPLOYMENT_TYPES = ['PAPER', 'LIVE AUTO'];


// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}


function isCurrentTimeBetween(startTime, endTime) {
  if (!startTime || !endTime) return false;

  const now = new Date();

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  const [startHour, startMinute] =
    startTime.split(':').map(Number);

  const [endHour, endMinute] =
    endTime.split(':').map(Number);

  const startMinutes =
    startHour * 60 + startMinute;

  const endMinutes =
    endHour * 60 + endMinute;

  return (
    currentMinutes >= startMinutes &&
    currentMinutes <= endMinutes
  );
}


function groupByCategory(items) {
  return items.reduce((acc, item) => {
    const categoryName =
      item.category || 'Uncategorized';

    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }

    acc[categoryName].push(item);

    return acc;
  }, {});
}


/*
  IMPORTANT

  Marketplace strategy:
    item.id

  Saved strategy:
    item.id = saved_strategies.id
    item.strategy_id = original strategy id

  Deployment must always use the original strategy ID.
*/
function getActualStrategyId(item) {
  return item.strategy_id || item.id;
}


// ---------------------------------------------------------
// DROPDOWN
// ---------------------------------------------------------

function Dropdown({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select',
}) {
  const [open, setOpen] =
    React.useState(false);

  return (
    <View style={{ marginBottom: 18 }}>

      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <TouchableOpacity
        style={styles.dropdownField}
        onPress={() =>
          setOpen((v) => !v)
        }
        activeOpacity={0.85}
      >
        <Text
          style={
            value
              ? styles.dropdownValue
              : styles.dropdownPlaceholder
          }
        >
          {value || placeholder}
        </Text>

        <Feather
          name={
            open
              ? 'chevron-up'
              : 'chevron-down'
          }
          size={16}
          color={COLORS.textGray}
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownMenu}>

          <FlatList
            data={options}
            keyExtractor={(item) => item}
            nestedScrollEnabled
            style={{ maxHeight: 220 }}

            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownMenuItem}
                onPress={() => {
                  onSelect(item);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    item === value && {
                      color: COLORS.blue,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {item}
                </Text>

                {item === value && (
                  <Feather
                    name="check"
                    size={14}
                    color={COLORS.blue}
                  />
                )}
              </TouchableOpacity>
            )}
          />

        </View>
      )}
    </View>
  );
}


// ---------------------------------------------------------
// DEPLOY MODAL
// ---------------------------------------------------------


function DeployModal({
  strategy,
  visible,
  onClose,
  onDeploySuccess,
}) {
  const [multiplier, setMultiplier] =
    React.useState('1x');

  const [deploymentType, setDeploymentType] =
    React.useState('LIVE AUTO');

  const [broker, setBroker] =
    React.useState('');

  const [brokers, setBrokers] =
    React.useState([]);

  const [loading, setLoading] =
    React.useState(false);


  React.useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const res = await apiRequest(
          'GET',
          '/api/broker/userbase'
        );

        setBrokers(res || []);
      } catch (err) {
        console.log(
          'brokers error',
          err
        );
      }
    };

    fetchBrokers();
  }, []);


  React.useEffect(() => {
    if (visible) {
      setMultiplier('1x');
      setDeploymentType('LIVE AUTO');
      setBroker('');
    }
  }, [visible, strategy]);

  
  React.useEffect(() => {
    if (visible) {
      setMultiplier('1x');
      setDeploymentType('LIVE AUTO');
      setBroker('');
    }
  }, [visible, strategy]);


  // ---------------------------------------------------------
  // TOKEN CALCULATION
  // ---------------------------------------------------------

  const calculateTokensToDeduct = () => {
    if (!strategy) {
      return 0;
    }

    const tokensRequired =
      Number(strategy.tokens_required ?? 1);

    const reduceTokenOnMultiplies =
      strategy.reducetokenonmultiplies === true;

    const reductionMultiplier =
      Number(strategy.reductionmultiplier ?? 1);

    const multiplierValue =
      parseInt(multiplier, 10);

    // CASE 1:
    // Token reduction on multiplier is OFF
    //
    // Whatever multiplier is selected,
    // only tokens_required tokens are deducted.

    if (!reduceTokenOnMultiplies) {
      return tokensRequired;
    }

    // CASE 2:
    // reductionMultiplier = 1
    //
    // 1X -> 1 token
    // 2X -> 2 tokens
    // 3X -> 3 tokens
    // 4X -> 4 tokens

    if (reductionMultiplier === 1) {
      return (
        tokensRequired +
        multiplierValue -
        1
      );
    }

    // CASE 3+
    //
    // Example reductionMultiplier = 3:
    //
    // 1X, 2X       -> 1 token
    // 3X, 4X, 5X   -> 2 tokens
    // 6X, 7X, 8X   -> 3 tokens
    // 9X, 10X, 11X -> 4 tokens

    if (multiplierValue < reductionMultiplier) {
      return tokensRequired;
    }

    return (
      tokensRequired +
      Math.ceil(
        (
          multiplierValue -
          reductionMultiplier +
          1
        ) / reductionMultiplier
      )
    );
  };


  const tokensToDeduct =
    calculateTokensToDeduct();


  if (!strategy) return null;



  if (!strategy) return null;


  const deployStrategy = async (
    strategyId,
    type,
    brokerId,
    multiplierValue
  ) => {
    if (loading) return;


    if (
      type !== 'paper' &&
      brokerId === ''
    ) {
      Alert.alert(
        'Broker Required',
        'Please select a broker account'
      );

      return;
    }


    try {
      setLoading(true);


      const res = await apiRequest(
        'POST',
        '/api/deployments',
        {
          strategy_id: strategyId,
          type,
          broker_account_id: brokerId,
          multiplier: multiplierValue,
        }
      );


      console.log(
        'deploy response',
        res
      );


      if (!res.success) {
        Alert.alert(
          'Deployment Failed',
          res.message ||
            'Something went wrong'
        );

        return;
      }


      onDeploySuccess({
        strategyName: strategy.name,
        broker:
          type === 'paper'
            ? 'Paper Trading'
            : type,
        exchange: 'NSE',
        capital: formatINR(
          strategy.capital_required
        ),
        lots: multiplierValue,
        status: 'ACTIVE',
      });


      onClose();

    } catch (err) {
      console.log(err);

      Alert.alert(
        'Server Error',
        err.message ||
          'Failed to deploy strategy'
      );

    } finally {
      setLoading(false);
    }
  };


  const handleDeploy = () => {
    let type = 'paper';
    let brokerId = '';


    if (
      deploymentType === 'LIVE AUTO'
    ) {
      const selectedBroker =
        brokers.find(
          (b) => b.id === broker
        );

      type =
        selectedBroker?.broker_name || '';

      brokerId = broker;
    }


    const multiplierValue =
      parseInt(multiplier, 10);


    deployStrategy(
      strategy.id,
      type,
      brokerId,
      multiplierValue
    );
  };


  const canDeploy =
    !loading &&
    (
      deploymentType !== 'LIVE AUTO' ||
      !!broker
    );


  const brokerOptions =
    brokers.map(
      (b) => b.broker_name
    );


  const selectedBrokerLabel =
    brokers.find(
      (b) => b.id === broker
    )?.broker_name || '';


  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (!loading) {
          onClose();
        }
      }}
    >

      <Pressable
        style={styles.modalOverlay}
        onPress={() => {
          if (!loading) {
            onClose();
          }
        }}
      >

        <Pressable
          style={styles.modalSheet}
          onPress={() => {}}
        >

          <View style={styles.modalHeader}>

            <Text style={styles.modalTitle}>
              {strategy.name}
            </Text>

            <TouchableOpacity
              onPress={() =>
                !loading && onClose()
              }
              hitSlop={8}
              disabled={loading}
            >
              <Feather
                name="x"
                size={20}
                color={
                  loading
                    ? COLORS.textGray
                    : COLORS.textDark
                }
              />
            </TouchableOpacity>

          </View>


          <Dropdown
            label="MULTIPLIER"
            value={multiplier}
            options={MULTIPLIERS}
            onSelect={setMultiplier}
          />

          {/* TOKEN COST */}

          <View style={styles.tokenCostBox}>
            <View style={styles.tokenCostLeft}>

              <View style={styles.tokenIcon}>
                <Feather
                  name="credit-card"
                  size={16}
                  color={COLORS.navy}
                />
              </View>

              <View>
                <Text style={styles.tokenCostLabel}>
                  DEPLOYMENT COST
                </Text>

                <Text style={styles.tokenCostValue}>
                  {tokensToDeduct}{' '}
                  {tokensToDeduct === 1
                    ? 'Token'
                    : 'Tokens'}
                </Text>
              </View>

            </View>

            <View style={styles.tokenMultiplierBox}>
              <Text style={styles.tokenMultiplierLabel}>
                MULTIPLIER
              </Text>

              <Text style={styles.tokenMultiplierValue}>
                {multiplier}
              </Text>
            </View>

          </View>

          {strategy.reducetokenonmultiplies === true && (
            <Text style={styles.tokenInfoText}>
              Token requirement changes based on the
              selected multiplier.
            </Text>
          )}



          <Dropdown
            label="DEPLOYMENT TYPE"
            value={deploymentType}
            options={DEPLOYMENT_TYPES}
            onSelect={setDeploymentType}
          />


          {deploymentType ===
            'LIVE AUTO' && (
            <Dropdown
              label="BROKER"
              value={selectedBrokerLabel}
              options={brokerOptions}
              onSelect={(label) => {
                const match =
                  brokers.find(
                    (b) =>
                      b.broker_name ===
                      label
                  );

                setBroker(
                  match?.id || ''
                );
              }}
              placeholder="Select broker"
            />
          )}


          <TouchableOpacity
            style={[
              styles.deployConfirmButton,
              !canDeploy && {
                opacity: 0.4,
              },
            ]}
            disabled={!canDeploy}
            onPress={handleDeploy}
            activeOpacity={0.85}
          >
            
          <Text style={styles.deployConfirmText}>
            {loading  
              ? 'DEPLOYING...'
              : `DEPLOY STRATEGY • ${tokensToDeduct} ${
                tokensToDeduct === 1 ? 'TOKEN' : 'TOKENS'
              }`}
          </Text>


          </TouchableOpacity>

        </Pressable>

      </Pressable>

    </Modal>
  );
}


// ---------------------------------------------------------
// MAIN STRATEGIES PAGE
// ---------------------------------------------------------

export default function Strategies({
  navigation,
}) {
  const insets =
    useSafeAreaInsets();

  const tabBarHeight =
    BASE_TAB_BAR_HEIGHT +
    insets.bottom;


  // -------------------------------------------------------
  // TAB
  // -------------------------------------------------------

  const [activeTab, setActiveTab] =
    React.useState('saved');


  // -------------------------------------------------------
  // COMMON STATE
  // -------------------------------------------------------

  const [query, setQuery] =
    React.useState('');

  const [expandedId, setExpandedId] =
    React.useState(null);

  const [deployTarget, setDeployTarget] =
    React.useState(null);

  const [deploymentResult, setDeploymentResult] =
    React.useState(null);


  // -------------------------------------------------------
  // MARKETPLACE
  // -------------------------------------------------------

  const [strategies, setStrategies] =
    React.useState([]);


  // -------------------------------------------------------
  // SAVED STRATEGIES
  // -------------------------------------------------------

  const [savedStrategies, setSavedStrategies] =
    React.useState([]);

  const [bookmarkModal, setBookmarkModal] =
  React.useState({
    visible: false,
    strategy: null,
    action: null,
  });

  const [bookmarkLoading, setBookmarkLoading] =
  React.useState(false);

  const [savedLoading, setSavedLoading] =
    React.useState(true);


  // -------------------------------------------------------
  // DEPLOYMENTS
  // -------------------------------------------------------

  const [todayDeployment, setTodayDeployment] =
    React.useState([]);


  // -------------------------------------------------------
  // FETCH MARKETPLACE
  // -------------------------------------------------------

  const fetchStrategies =
    React.useCallback(
      async (userId) => {
        try {
          const response =
            await apiRequest(
              'GET',
              `/api/stratergy/user/${userId}`
            );

          const sorted =
            (
              response?.strategies ||
              []
            ).sort(
              (a, b) =>
                Number(a.state_id) -
                Number(b.state_id)
            );

          setStrategies(sorted);

        } catch (err) {
          console.log(
            'strategies error',
            err
          );
        }
      },
      []
    );


  // -------------------------------------------------------
  // FETCH USER
  // -------------------------------------------------------

  const fetchUser =
    React.useCallback(
      async () => {
        try {
          const res =
            await apiRequest(
              'POST',
              '/api/users/me'
            );

          if (res?.id) {
            fetchStrategies(res.id);
          }

        } catch (err) {
          console.log(
            'user error',
            err
          );
        }
      },
      [fetchStrategies]
    );


  // -------------------------------------------------------
  // FETCH SAVED STRATEGIES
  // -------------------------------------------------------

  const fetchSavedStrategies =
    React.useCallback(
      async () => {
        try {
          setSavedLoading(true);

          const response =
            await apiRequest(
              'GET',
              '/api/saved-strategies/my'
            );


          const saved =
            response?.strategies || [];


          setSavedStrategies(saved);


          /*
            IMPORTANT:

            Initial page should be
            Saved Strategies.

            But if user has no saved
            strategies, automatically
            switch to Marketplace.
          */
          if (saved.length === 0) {
            setActiveTab('marketplace');
          }

        } catch (err) {
          console.log(
            'saved strategies error',
            err
          );

          /*
            If saved strategies API
            fails, marketplace should
            still remain usable.
          */
          setActiveTab('marketplace');

        } finally {
          setSavedLoading(false);
        }
      },
      []
    );

  const savedStrategyIds = React.useMemo(() => {
  return new Set(
    savedStrategies
      .map((item) => item.strategy_id)
      .filter(Boolean)
  );
  }, [savedStrategies]);


  // -------------------------------------------------------
// SAVE / UNSAVE STRATEGY
// -------------------------------------------------------

const handleBookmarkPress = (strategy) => {
  const isSaved = savedStrategyIds.has(strategy.id);

  setBookmarkModal({
    visible: true,
    strategy,
    action: isSaved ? 'unsave' : 'save',
  });
};


const confirmBookmarkAction = async () => {
  const strategy = bookmarkModal.strategy;
  const action = bookmarkModal.action;

  if (!strategy || !action || bookmarkLoading) {
    return;
  }

  try {
    setBookmarkLoading(true);

    if (action === 'save') {
      const response = await apiRequest(
        'POST',
        '/api/saved-strategies',
        {
          strategyId: strategy.id,
        }
      );

      if (response?.strategy) {
        setSavedStrategies((prev) => [
          ...prev,
          response.strategy,
        ]);
      }

    } else {
      const savedStrategy = savedStrategies.find(
        (item) =>
          item.strategy_id === strategy.id
      );

      if (!savedStrategy) {
        throw new Error(
          'Saved strategy not found'
        );
      }

      await apiRequest(
        'DELETE',
        `/api/saved-strategies/${savedStrategy.id}`
      );

      setSavedStrategies((prev) =>
        prev.filter(
          (item) =>
            item.id !== savedStrategy.id
        )
      );
    }

    setBookmarkModal({
      visible: false,
      strategy: null,
      action: null,
    });

  } catch (err) {
    console.log(
      'bookmark error',
      err
    );

    Alert.alert(
      'Error',
      err.message ||
        'Unable to update saved strategy'
    );

  } finally {
    setBookmarkLoading(false);
  }
};


const closeBookmarkModal = () => {
  if (bookmarkLoading) return;

  setBookmarkModal({
    visible: false,
    strategy: null,
    action: null,
  });
};


  // -------------------------------------------------------
  // FETCH TODAY DEPLOYMENTS
  // -------------------------------------------------------

  const fetchTodayDeployment =
    React.useCallback(
      async () => {
        try {
          const res =
            await apiRequest(
              'GET',
              '/api/deployments/user/today'
            );

          setTodayDeployment(
            res || []
          );

        } catch (err) {
          console.log(
            'deployments error',
            err
          );
        }
      },
      []
    );


      const refreshTodayDeployments = async () => {
        try {
          const res = await apiRequest(
            'GET',
            '/api/deployments/user/today'
          );

          setTodayDeployment(res || []);
        } catch (err) {
          console.error('Failed to refresh deployments:', err);
        }
      };

      const handleExitStrategy = (deployment) => {
        Alert.alert(
            'Exit Strategy',
            'Are you sure you want to exit this strategy?',
            [
            {
              text: 'Cancel',
              style: 'cancel',
          },
          {
            text: 'Exit',
              style: 'destructive',
            onPress: async () => {
                try {
                await apiRequest(
                    'POST',
                    `/api/deployments/userdep/stopdep/${deployment.id}`
                  );

                  Alert.alert(
                  'Success',
                  'Strategy exited successfully'
                );

                  await refreshTodayDeployments();

                } catch (err) {
                  console.error('Exit strategy error:', err);

                Alert.alert(
                  'Error',
                  err?.message || 'Failed to exit strategy'
                );
              }
              },
            },
          ]
        );
      };

      const handleDeleteStrategy = (strategy, deployment) => {
          Alert.alert(
          'Delete Strategy',
          'Are you sure you want to delete this strategy?',
          [
          {
              text: 'Cancel',
              style: 'cancel',
          },
          {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
              try {
                await apiRequest(
                  'POST',
                  `/api/deployments/stopdeployment?strategy_id=${strategy.id}&broker_account_id=${deployment.broker_account_id}`
                );
                
                Alert.alert(
                  'Deleted',
                  'Strategy deleted successfully'
                );

                  await refreshTodayDeployments();

                } catch (err) {
                    console.error('Delete strategy error:', err);

                  Alert.alert(
                  'Error',
                  err?.message || 'Failed to delete strategy'
                  );
                }
              },
            },
          ]
        );
      };

  // -------------------------------------------------------
  // INITIAL LOAD
  // -------------------------------------------------------

  React.useEffect(() => {
    fetchSavedStrategies();
    fetchUser();
    fetchTodayDeployment();
  }, [
    fetchSavedStrategies,
    fetchUser,
    fetchTodayDeployment,
  ]);


  // -------------------------------------------------------
  // DEPLOYED IDS
  // -------------------------------------------------------

  const deployedStrategyIds =
    React.useMemo(
      () =>
        new Set(
          todayDeployment.map(
            (d) => d.strategy_id
          )
        ),
      [todayDeployment]
    );


  // -------------------------------------------------------
  // CURRENT DATASET
  // -------------------------------------------------------

  const currentStrategies =
    activeTab === 'saved'
      ? savedStrategies
      : strategies;


  // -------------------------------------------------------
  // SEARCH
  // -------------------------------------------------------

  const filteredStrategies =
    React.useMemo(() => {
      if (!query.trim()) {
        return currentStrategies;
      }


      const q =
        query
          .trim()
          .toLowerCase();


      return currentStrategies.filter(
        (s) =>
          s.state_id
            ?.toString()
            .toLowerCase()
            .includes(q) ||

          s.name
            ?.toLowerCase()
            .includes(q) ||

          s.description
            ?.toLowerCase()
            .includes(q) ||

          s.category
            ?.toLowerCase()
            .includes(q)
      );

    }, [
      currentStrategies,
      query,
    ]);


  // -------------------------------------------------------
  // GROUP BY CATEGORY
  // -------------------------------------------------------

  const sections =
    React.useMemo(() => {
      const grouped =
        groupByCategory(
          filteredStrategies
        );

      return Object.entries(
        grouped
      ).map(
        ([title, data]) => ({
          title,
          data,
        })
      );

    }, [filteredStrategies]);


  // -------------------------------------------------------
  // TAB CHANGE
  // -------------------------------------------------------

  const handleTabChange = (
    tab
  ) => {
    setActiveTab(tab);
    setQuery('');
    setExpandedId(null);
  };


  // -------------------------------------------------------
  // DEPLOYMENT SUCCESS SCREEN
  // -------------------------------------------------------

  if (deploymentResult) {
    return (
      <DeploymentSuccess
        deployment={deploymentResult}

        onViewDeployment={() => {
          setDeploymentResult(null);
        }}

        onGoToDashboard={() => {
          setDeploymentResult(null);

          navigation?.navigate?.(
            'Home'
          );
        }}
      />
    );
  }


  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >

      <StatusBar style="dark" />


      {/* HEADER */}

      <View style={styles.header}>

        <TouchableOpacity
          style={
            styles.headerIconButton
          }
          onPress={() =>
            navigation?.goBack?.()
          }
          hitSlop={8}
        >
          <Feather
            name="chevron-left"
            size={22}
            color={COLORS.textDark}
          />
        </TouchableOpacity>


        <Text
          style={styles.headerTitle}
        >
          Strategies
        </Text>


        <View
          style={{ width: 32 }}
        />

      </View>


      {/* -------------------------------------------------
          TABS
      ------------------------------------------------- */}

      <View style={styles.tabsContainer}>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'saved' &&
              styles.activeTabButton,
          ]}
          onPress={() =>
            handleTabChange(
              'saved'
            )
          }
          activeOpacity={0.8}
        >
          <Feather
            name="bookmark"
            size={16}
            color={
              activeTab === 'saved'
                ? COLORS.navy
                : COLORS.textGray
            }
          />

          <Text
            style={[
              styles.tabText,
              activeTab === 'saved' &&
                styles.activeTabText,
            ]}
          >
            Saved Strategies
          </Text>

          {savedStrategies.length >
            0 && (
            <View
              style={[
                styles.tabCount,
                activeTab ===
                  'saved' &&
                  styles.activeTabCount,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab ===
                    'saved' &&
                    styles.activeTabCountText,
                ]}
              >
                {savedStrategies.length}
              </Text>
            </View>
          )}

        </TouchableOpacity>


        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab ===
              'marketplace' &&
              styles.activeTabButton,
          ]}
          onPress={() =>
            handleTabChange(
              'marketplace'
            )
          }
          activeOpacity={0.8}
        >
          <Feather
            name="shopping-bag"
            size={16}
            color={
              activeTab ===
              'marketplace'
                ? COLORS.navy
                : COLORS.textGray
            }
          />

          <Text
            style={[
              styles.tabText,
              activeTab ===
                'marketplace' &&
                styles.activeTabText,
            ]}
          >
            Marketplace
          </Text>

        </TouchableOpacity>

      </View>


      {/* -------------------------------------------------
          CONTENT
      ------------------------------------------------- */}

      <SectionList
        sections={sections}

        keyExtractor={(item) =>
          String(item.id)
        }

        showsVerticalScrollIndicator={
          false
        }

        stickySectionHeadersEnabled={
          false
        }

        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom:
            tabBarHeight + 24,
        }}


        ListHeaderComponent={
          <View
            style={styles.searchBar}
          >

            <Feather
              name="search"
              size={16}
              color={
                COLORS.textGray
              }
            />

            <TextInput
              style={
                styles.searchInput
              }
              placeholder={
                'Search strategies by name, ID or category...'
              }
              placeholderTextColor={
                COLORS.textGray
              }
              value={query}
              onChangeText={
                setQuery
              }
            />

          </View>
        }


        ListEmptyComponent={
          savedLoading &&
          activeTab === 'saved'
            ? (
              <View
                style={
                  styles.emptyContainer
                }
              >
                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Loading saved strategies...
                </Text>
              </View>
            )
            : (
              <View
                style={
                  styles.emptyContainer
                }
              >

                <Feather
                  name={
                    activeTab ===
                    'saved'
                      ? 'bookmark'
                      : 'search'
                  }
                  size={30}
                  color={
                    COLORS.textGray
                  }
                />

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  {activeTab ===
                  'saved'
                    ? 'No saved strategies'
                    : 'No matching strategies found'}
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  {activeTab ===
                  'saved'
                    ? 'Save strategies from the Marketplace to find them here.'
                    : 'Try searching with a different name, ID or category.'}
                </Text>

                {activeTab ===
                  'saved' && (
                  <TouchableOpacity
                    style={
                      styles.emptyMarketplaceButton
                    }
                    onPress={() =>
                      handleTabChange(
                        'marketplace'
                      )
                    }
                    activeOpacity={
                      0.85
                    }
                  >
                    <Text
                      style={
                        styles.emptyMarketplaceButtonText
                      }
                    >
                      GO TO MARKETPLACE
                    </Text>
                  </TouchableOpacity>
                )}

              </View>
            )
        }


        renderSectionHeader={({
          section: {
            title,
            data,
          },
        }) => (
          <View
            style={
              styles.sectionHeader
            }
          >

            <Feather
              name="folder"
              size={16}
              color={
                COLORS.textGray
              }
            />

            <Text
              style={
                styles.sectionTitle
              }
            >
              {title}
            </Text>

            <View
              style={
                styles.sectionCountPill
              }
            >
              <Text
                style={
                  styles.sectionCountText
                }
              >
                {data.length}
              </Text>
            </View>

          </View>
        )}


        renderItem={({ item }) => {

          const itemId = getActualStrategyId(item);

          const expansionId =
            activeTab === 'saved'
              ? `saved-${item.id}`
              : `market-${item.id}`;

          const isExpanded = expandedId === expansionId;

          const isDeployed = deployedStrategyIds.has(itemId);

          const isRunning = isCurrentTimeBetween(
            item.starting_time,
            item.ending_time
            );

          // Get today's deployment for this strategy
          const strategyDeployment = todayDeployment
            .filter(
            (d) => String(d.strategy_id) === String(itemId)
            )
            .sort(
              (a, b) =>
              new Date(b.deployed_at || b.created_at) -
              new Date(a.deployed_at || a.created_at)
            )[0];

              const description =
            item.description ||
            '';


          const isLong =
            description.length >
            120;


          return (
            <View
              style={
                styles.strategyCard
              }
            >

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  setExpandedId(
                    isExpanded
                      ? null
                      : expansionId
                  )
                }
              >

                <View
                  style={
                    styles.rowBetween
                    }
                >

                  <View
                    style={
                      styles.rowStart
                      }
                      >

                        <Text
                      style={
                         styles.strategyIndex
                            }
    >
      ID:{' '}
      {item.state_id ||
        'N/A'}
    </Text>

    {activeTab === 'saved' && (
      <View
        style={
          styles.savedBadge
        }
      >
        <Feather
          name="bookmark"
          size={11}
          color={COLORS.blue}
          fill={COLORS.blue}
        />

        <Text
          style={
            styles.savedBadgeText
          }
        >
          SAVED
        </Text>
      </View>
    )}

  </View>


  <View
    style={styles.cardActions}
  >
{activeTab === 'marketplace' && (
  <TouchableOpacity
    style={[
      styles.marketplaceSaveBadge,
      savedStrategyIds.has(item.id) &&
        styles.marketplaceSavedBadge,
    ]}
    activeOpacity={0.75}
    onPress={() =>
      handleBookmarkPress(item)
    }
    hitSlop={6}
  >
    <Feather
      name="bookmark"
      size={11}
      color={
        savedStrategyIds.has(item.id)
          ? COLORS.blue
          : COLORS.textGray
      }
      fill={
        savedStrategyIds.has(item.id)
          ? COLORS.blue
          : 'none'
      }
    />

    <Text
      style={[
        styles.marketplaceSaveBadgeText,
        savedStrategyIds.has(item.id) &&
          styles.marketplaceSavedBadgeText,
      ]}
    >
      {savedStrategyIds.has(item.id)
        ? 'SAVED'
        : 'SAVE'}
    </Text>
  </TouchableOpacity>
)}

    <Feather
      name={
        isExpanded
          ? 'chevron-up'
          : 'chevron-down'
      }
      size={18}
      color={COLORS.textGray}
    />

  </View>

</View>

                <Text
                  style={
                    styles.strategyTitle
                  }
                >
                  {item.name}
                </Text>


                {!!description && (
                  <Text
                    style={
                      styles.strategyDescription
                    }
                    numberOfLines={
                      isExpanded
                        ? undefined
                        : 1
                    }
                  >
                    {isExpanded ||
                    !isLong
                      ? description
                      : `${description.slice(
                          0,
                          120
                        )}...`}
                  </Text>
                )}

              </TouchableOpacity>


              {isExpanded && (
                <View
                  style={
                    styles.expandedSection
                  }
                >

                  <View
                    style={
                      styles.divider
                    }
                  />


                  <Text
                    style={
                      styles.capitalLabel
                    }
                  >
                    Required Capital
                  </Text>


                  <Text
                    style={
                      styles.capitalValue
                    }
                  >
                    {formatINR(
                      item.capital_required
                    )}
                  </Text>


                  {isDeployed && strategyDeployment ? (
                    <View style={styles.deployedActions}>

                    <View style={styles.deployedBadge}>
                    <Feather
                      name="check-circle"
                      size={15}
                      color="#16a34a"
                      />      

                    <Text style={styles.deployedBadgeText}>
                      DEPLOYED
                    </Text>
                    </View>
{/* 
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={() => {
                      if (isRunning) {
                        handleExitStrategy(strategyDeployment);
                        } else {
                        handleDeleteStrategy(item, strategyDeployment);
                      }
                      }}
                      >
                    <Feather
                        name="more-vertical"
                        size={22}
                        color={COLORS.text}
                        />
                    </TouchableOpacity>
 */}
                    </View>
                    ) : (
                    <TouchableOpacity
                      style={[
                      styles.deployButton,
                      isRunning && styles.deployButtonDisabled,
                    ]}
                      disabled={isRunning}
                      onPress={() => setDeployTarget(item)}
                    >
                    <Text style={styles.deployButtonText}>
                    {isRunning
                      ? 'RUNNING TIME'
                      : 'DEPLOY STRATEGY'}
                      </Text>
                      </TouchableOpacity>
                    )}
                </View>
              )}

            </View>
          );
        }}


        ItemSeparatorComponent={() => (
          <View
            style={{ height: 12 }}
          />
        )}


        SectionSeparatorComponent={() => (
          <View
            style={{ height: 20 }}
          />
        )}
      />


      {/* DEPLOY MODAL */}

      <DeployModal
        strategy={deployTarget}
        visible={!!deployTarget}
        onClose={() =>
          setDeployTarget(null)
        }
        onDeploySuccess={
          setDeploymentResult
        }
      />

      <Modal
  visible={bookmarkModal.visible}
  transparent
  animationType="fade"
  onRequestClose={closeBookmarkModal}
>
  <Pressable
    style={styles.bookmarkModalOverlay}
    onPress={closeBookmarkModal}
  >

    <Pressable
      style={styles.bookmarkModalCard}
      onPress={() => {}}
    >

      <View
        style={styles.bookmarkModalIcon}
      >
        <Feather
          name="bookmark"
          size={22}
          color={COLORS.blue}
        />
      </View>


      <Text
        style={styles.bookmarkModalTitle}
      >
        {bookmarkModal.action === 'save'
          ? 'Save Strategy?'
          : 'Unsave Strategy?'}
      </Text>


      <Text
        style={styles.bookmarkModalText}
      >
        {bookmarkModal.action === 'save'
          ? `Are you sure you want to save "${bookmarkModal.strategy?.name || 'this strategy'}"?`
          : `Are you sure you want to unsave "${bookmarkModal.strategy?.name || 'this strategy'}"?`}
      </Text>


      <View
        style={styles.bookmarkModalButtons}
      >

        <TouchableOpacity
          style={styles.bookmarkCancelButton}
          onPress={closeBookmarkModal}
          disabled={bookmarkLoading}
          activeOpacity={0.85}
        >
          <Text
            style={
              styles.bookmarkCancelText
            }
          >
            CANCEL
          </Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={styles.bookmarkConfirmButton}
          onPress={confirmBookmarkAction}
          disabled={bookmarkLoading}
          activeOpacity={0.85}
        >
          <Text
            style={
              styles.bookmarkConfirmText
            }
          >
            {bookmarkLoading
              ? 'PLEASE WAIT...'
              : bookmarkModal.action === 'save'
              ? 'SAVE'
              : 'UNSAVE'}
          </Text>
        </TouchableOpacity>

      </View>

    </Pressable>

  </Pressable>
</Modal>

    </SafeAreaView>
  );
}


// ---------------------------------------------------------
// STYLES
// ---------------------------------------------------------

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor:
      COLORS.bg,
  },


  rowStart: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },


  // -------------------------------------------------------
  // HEADER
  // -------------------------------------------------------

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },


  headerIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent:
      'center',
  },


  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },


  // -------------------------------------------------------
  // TABS
  // -------------------------------------------------------

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor:
      COLORS.cardBg,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },


  tabButton: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 6,
  },


  activeTabButton: {
    backgroundColor:
      '#EEF2FF',
  },


  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textGray,
  },


  activeTabText: {
    color: COLORS.navy,
    fontWeight: '800',
  },


  tabCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent:
      'center',
    paddingHorizontal: 5,
  },


  activeTabCount: {
    backgroundColor:
      '#DDE6FF',
  },


  tabCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textGray,
  },


  activeTabCountText: {
    color: COLORS.blue,
  },


  // -------------------------------------------------------
  // SEARCH
  // -------------------------------------------------------

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      COLORS.cardBg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginTop: 4,
    marginBottom: 20,
  },


  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark,
    marginLeft: 8,
  },


  // -------------------------------------------------------
  // CATEGORY
  // -------------------------------------------------------

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor:
      COLORS.border,
  },


  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginLeft: 8,
  },


  sectionCountPill: {
    marginLeft: 8,
    backgroundColor:
      COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },


  sectionCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textGray,
  },


  // -------------------------------------------------------
  // STRATEGY CARD
  // -------------------------------------------------------

  strategyCard: {
    backgroundColor:
      COLORS.cardBg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 16,
    padding: 16,
  },


  strategyIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textGray,
    backgroundColor:
      COLORS.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },


  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor:
      '#EEF2FF',
  },


  savedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.blue,
    marginLeft: 3,
  },


  strategyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 8,
    lineHeight: 19,
  },


  strategyDescription: {
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: 4,
  },


  // -------------------------------------------------------
  // EXPANDED
  // -------------------------------------------------------

  expandedSection: {
    marginTop: 4,
  },


  divider: {
    height: 1,
    backgroundColor:
      COLORS.border,
    marginVertical: 14,
  },


  capitalLabel: {
    fontSize: 11,
    color: COLORS.textGray,
    marginBottom: 4,
  },


  capitalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 14,
  },


  deployButton: {
    backgroundColor:
      COLORS.navy,
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent:
      'center',
  },


  deployButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },


  // -------------------------------------------------------
  // EMPTY
  // -------------------------------------------------------

  emptyContainer: {
    alignItems: 'center',
    justifyContent:
      'center',
    paddingVertical: 45,
    paddingHorizontal: 25,
  },


  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 12,
    textAlign: 'center',
  },


  emptyText: {
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 18,
  },


  emptyMarketplaceButton: {
    marginTop: 18,
    backgroundColor:
      COLORS.navy,
    borderRadius: 10,
    paddingHorizontal: 18,
    height: 40,
    alignItems: 'center',
    justifyContent:
      'center',
  },


  emptyMarketplaceButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },


  // -------------------------------------------------------
  // DEPLOY MODAL
  // -------------------------------------------------------

  modalOverlay: {
    flex: 1,
    backgroundColor:
      COLORS.overlay,
    justifyContent:
      'flex-end',
  },


  modalSheet: {
    backgroundColor:
      COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },


  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 20,
  },


  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },


  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textGray,
    marginBottom: 8,
  },


  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },


  dropdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },


  dropdownPlaceholder: {
    fontSize: 14,
    color: COLORS.textGray,
  },


  dropdownMenu: {
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },


  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },


  dropdownMenuItemText: {
    fontSize: 13,
    color: COLORS.textDark,
  },


  deployConfirmButton: {
    backgroundColor:
      COLORS.navy,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent:
      'center',
    marginTop: 8,
  },


  deployConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

    // -------------------------------------------------------
  // MARKETPLACE BOOKMARK
  // -------------------------------------------------------

  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },


  bookmarkButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },


  // -------------------------------------------------------
  // BOOKMARK CONFIRMATION MODAL
  // -------------------------------------------------------

  bookmarkModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },


  bookmarkModalCard: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 22,
  },


  bookmarkModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },


  bookmarkModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
  },


  bookmarkModalText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textGray,
    textAlign: 'center',
    marginTop: 8,
  },


  bookmarkModalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },


  bookmarkCancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },


  bookmarkCancelText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textGray,
  },


  bookmarkConfirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },


  bookmarkConfirmText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  marketplaceSaveBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
  backgroundColor: COLORS.bg,
  borderWidth: 1,
  borderColor: COLORS.border,
},

marketplaceSavedBadge: {
  backgroundColor: '#EEF2FF',
  //borderColor: '#DDE6FF',
},

marketplaceSaveBadgeText: {
  fontSize: 9,
  fontWeight: '800',
  color: COLORS.textGray,
  marginLeft: 4,
},

marketplaceSavedBadgeText: {
  color: COLORS.blue,
},

deployedActions: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 12,
},

deployedBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},

deployedBadgeText: {
  fontSize: 13,
  fontWeight: '700',
  color: '#16a34a',
},

moreButton: {
  width: 38,
  height: 38,
  borderRadius: 19,
  alignItems: 'center',
  justifyContent: 'center',
},

actionOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 999,
},

actionOverlayBackground: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.25)',
},

actionMenu: {
  position: 'absolute',
  right: 20,
  bottom: 90,
  backgroundColor: '#fff',
  borderRadius: 12,
  paddingVertical: 6,
  minWidth: 170,

  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },

    android: {
      elevation: 8,
    },
  }),
},

actionMenuItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 14,
  gap: 10,
},

actionMenuText: {
  fontSize: 14,
  fontWeight: '600',
},


  // -------------------------------------------------------
  // TOKEN COST
  // -------------------------------------------------------

  tokenCostBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F6FA',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: -4,
    marginBottom: 18,
  },

  tokenCostLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tokenIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  tokenCostLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textGray,
    marginBottom: 2,
  },

  tokenCostValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
  },

  tokenMultiplierBox: {
    alignItems: 'flex-end',
  },

  tokenMultiplierLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textGray,
    marginBottom: 2,
  },

  tokenMultiplierValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },

  tokenInfoText: {
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.textGray,
    marginTop: -10,
    marginBottom: 14,
  },


});