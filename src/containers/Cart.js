import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  View,
  Text,
  Alert,
  Image,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import Icon from 'react-native-vector-icons/FontAwesome';
import Swipeout from 'react-native-swipeout';

// Import actions.
import * as cartActions from '../actions/cartActions';

// Components
import Spinner from '../components/Spinner';

// Styles
const styles = EStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBtn: {
    padding: 10,
  },
  trashIcon: {
    height: 20,
    fontSize: 20,
  },
  productItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
    paddingBottom: 10,
    flexDirection: 'row',
    padding: 14,
  },
  productItemImage: {
    width: 100,
    height: 100,
  },
  productItemName: {
    fontSize: '0.9rem',
    color: 'black',
    marginBottom: 5,
  },
  productItemPrice: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: 'black',
  },
  placeOrderBtn: {
    backgroundColor: '#FF6008',
    padding: 14,
  },
  placeOrderBtnText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: '1rem',
  },
  emptyListContainer: {
    marginTop: '3rem',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyListIconWrapper: {
    backgroundColor: '#3FC9F6',
    width: '12rem',
    height: '12rem',
    borderRadius: '6rem',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListIcon: {
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: '6rem',
  },
  emptyListHeader: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'black',
    marginTop: '1rem',
  },
  emptyListDesc: {
    fontSize: '1rem',
    color: '#24282b',
    marginTop: '0.5rem',
  },
});

class Cart extends Component {
  static propTypes = {
    navigation: PropTypes.shape({}),
    cartActions: PropTypes.shape({
      fetch: PropTypes.func,
      clear: PropTypes.func,
      remove: PropTypes.func,
    }),
    auth: PropTypes.shape({}),
    cart: PropTypes.shape({}),
  };

  static navigationOptions = ({ navigation }) => {
    if (!navigation.state.params) {
      return {};
    }
    let { title, headerRight } = navigation.state.params;
    return {
      title,
      headerRight,
    };
  };

  constructor(props) {
    super(props);

    this.state = {
      refreshing: false,
      products: [],
    };
  }

  componentDidMount() {
    const { navigation, cart } = this.props;
    navigation.setParams({
      title: `CART (${cart.amount})`,
      headerRight: this.renderClearCart(),
    });
  }

  componentWillReceiveProps(nextProps) {
    const { cart, navigation } = nextProps;
    if (cart.fetching) {
      return;
    }
    const products = Object.keys(cart.products).map((key) => {
      const result = cart.products[key];
      result.cartId = key;
      return result;
    });
    this.setState({
      products,
      refreshing: false,
    });
  }

  handleRefresh() {
    const { cartActions, auth } = this.props;
    this.setState(
      { refreshing: true },
      () => cartActions.fetch(auth.token),
    );
  }

  handlePlaceOrder() {
    const { auth, navigation } = this.props;

    if (!auth.logged) {
      return navigation.navigate('Login');
    }
    const products = {};
    this.state.products.forEach((p) => {
      products[p.product_id] = {
        product_id: p.product_id,
        amount: p.amount,
      };
    });
    return navigation.navigate('Checkout', {
      user_id: 3, // FIXME
      products,
    });
  }

  handleRemoveProduct = (product) => {
    const { cartActions, auth } = this.props;
    cartActions.remove(auth.token, product.cartId);
  };

  handleChangeScreenTitle = () => {
    const { cart, navigation } = this.props;
    const newTitle = `CART (${cart.amount})`;
    // FIXME brainfuck code to update title.
    if ('params' in navigation.state) {
      if (navigation.state.params.title != newTitle) {
        // setTimeout(() => {
        //   navigation.setParams({
        //     title: `CART (${cart.amount})`,
        //     headerRight: this.renderClearCart(),
        //   });
        // }, 500);
      }
    }
  };

  renderClearCart = () => {
    if (!this.props.cart.amount) {
      return null;
    }
    return (
      <TouchableOpacity
        style={styles.topBtn}
        onPress={() => {
          Alert.alert(
            'Clear all cart ?',
            '',
            [
              {
                text: 'Cancel',
                onPress: () => {},
                style: 'cancel'
              },
              {
                text: 'OK',
                onPress: () => this.props.cartActions.clear(),
              },
            ],
            { cancelable: true }
          );
        }}
      >
        <Icon name="trash" style={styles.trashIcon} />
      </TouchableOpacity>
    );
  };

  renderProductItem = (item) => {
    let productImage = null;
    if ('http_image_path' in item.main_pair.detailed) {
      productImage = (<Image
        source={{ uri: item.main_pair.detailed.http_image_path }}
        style={styles.productItemImage}
      />);
    }

    const swipeoutBtns = [
      {
        text: 'Delete',
        type: 'delete',
        onPress: () => this.handleRemoveProduct(item),
      },
    ];

    return (
      <Swipeout
        autoClose
        right={swipeoutBtns}
        backgroundColor={'#fff'}
      >
        <View style={styles.productItem}>
          {productImage}
          <View style={styles.productItemDetail}>
            <Text style={styles.productItemName}>
              {item.product}
            </Text>
            <Text style={styles.productItemPrice}>
              {item.amount} x ${item.price}
            </Text>
          </View>
        </View>
      </Swipeout>
    );
  }

  renderPlaceOrder() {
    const { cart } = this.props;
    return (
      <View style={styles.orderInfo}>
        <View>
          <Text>Subtotal: {cart.subtotal}</Text>
          <Text>Total: {cart.total}</Text>
        </View>
        <TouchableOpacity
          style={styles.placeOrderBtn}
          onPress={() => this.handlePlaceOrder()}
        >
          <Text style={styles.placeOrderBtnText}>
            Place Order
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  renderEmptyList = () => (
    <View style={styles.emptyListContainer}>
      <View style={styles.emptyListIconWrapper}>
        <Icon name="shopping-cart" style={styles.emptyListIcon} />
      </View>
      <Text style={styles.emptyListHeader}>
        Your shopping cart is empty.
      </Text>
      <Text style={styles.emptyListDesc}>
        Looking for ideas?
      </Text>
    </View>
  );

  renderList() {
    const { products } = this.state;
    return (
      <View style={styles.container}>
        <FlatList
          data={products}
          keyExtractor={(item, index) => index}
          renderItem={({ item }) => this.renderProductItem(item)}
          onRefresh={() => this.handleRefresh()}
          refreshing={this.state.refreshing}
        />
        {this.renderPlaceOrder()}
      </View>
    );
  }

  renderSpinner = () => {
    const { cart } = this.props;
    if (this.state.refreshing) {
      return false;
    }
    return (
      <Spinner visible={cart.fetching} />
    );
  };

  render() {
    const { products } = this.state;
    this.handleChangeScreenTitle();
    return (
      <View style={styles.container}>
        {products.length ? this.renderList() : this.renderEmptyList()}
        {this.renderSpinner()}
      </View>
    );
  }
}

Cart.propTypes = {
  navigation: PropTypes.shape({}),
  cart: PropTypes.shape({
    amount: PropTypes.number,
  }),
};

export default connect(state => ({
  nav: state.nav,
  auth: state.auth,
  cart: state.cart,
}),
  dispatch => ({
    cartActions: bindActionCreators(cartActions, dispatch),
  })
)(Cart);
