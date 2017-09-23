import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';

// Import actions.
import * as ordersActions from '../actions/ordersActions';
import * as cartActions from '../actions/cartActions';
import * as paymentsActions from '../actions/paymentsActions';

// Components
import CheckoutSteps from '../components/CheckoutSteps';
import CartFooter from '../components/CartFooter';
import FormBlock from '../components/FormBlock';
import PaymentPhoneForm from '../components/PaymentPhoneForm';
import PaymentCreditCardForm from '../components/PaymentCreditCardForm';
import PaymentCheckForm from '../components/PaymentCheckForm';
import PaymentPaypalForm from '../components/PaymentPaypalForm';
import { stripTags, formatPrice } from '../utils';
import i18n from '../utils/i18n';

const styles = EStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  contentContainer: {
    padding: 14,
  },
  paymentItem: {
    padding: 14,
    marginLeft: -14,
    marginRight: -14,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#F1F1F1',
    backgroundColor: '#fff',
    marginBottom: 6,
    flexDirection: 'row',
  },
  paymentItemText: {
    fontSize: '0.9rem',
    paddingBottom: 6,
  },
  paymentItemDesc: {
    fontSize: '0.8rem',
    paddingBottom: 6,
    color: 'gray',
    marginTop: 10,
  },
  uncheckIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  checkIcon: {
    width: 20,
    height: 20,
    opacity: 0.2,
    marginRight: 6,
  }
});

const PAYMENT_CREDIT_CARD = 'Credit card';
const PAYMENT_PHONE = 'Phone';
const PAYMENT_CHECK = 'Check';
const PAYMENT_PAYPAL_EXPRESS = 'PayPal Express Checkout';

class CheckoutStepThree extends Component {
  static propTypes = {
    cart: PropTypes.shape({
      items: PropTypes.arrayOf(PropTypes.object),
      fetching: PropTypes.bool,
    }),
    auth: PropTypes.shape({
      token: PropTypes.string,
    }),
    cartActions: PropTypes.shape({
      clear: PropTypes.func,
    }),
    ordersActions: PropTypes.shape({
      create: PropTypes.func,
    }),
    shipping_id: PropTypes.string,
    navigator: PropTypes.shape({
      push: PropTypes.func,
    }),
    total: PropTypes.number,
  };

  constructor(props) {
    super(props);

    this.state = {
      selectedItem: null,
      disablePlaceOrder: true,
      total: 0,
      items: [],
    };
  }

  componentDidMount() {
    const { cart } = this.props;
    const items = Object.keys(cart.payments).map(k => cart.payments[k]);
    // FIXME: Default selected payment method.
    const selectedItem = items[1];

    this.setState({
      items,
      selectedItem,
      total: this.props.total,
    });
  }

  handlePlaceOrder() {
    const { selectedItem } = this.state;
    if (!selectedItem) {
      return null;
    }

    if (selectedItem.payment === PAYMENT_PAYPAL_EXPRESS) {
      return this.placePayPalOrder();
    }
    return this.placeOrderAndComplete();
  }

  placeOrderAndComplete() {
    const { cart, auth, shipping_id, ordersActions, navigator, cartActions } = this.props;
    const values = this.paymentFormRef.getValue();
    if (!values) {
      return null;
    }
    const orderInfo = {
      products: {},
      shipping_id,
      payment_id: this.state.selectedItem.payment_id,
      user_data: cart.user_data,
      ...values,
    };
    Object.keys(cart.products).map((key) => {
      const p = cart.products[key];
      orderInfo.products[p.product_id] = {
        product_id: p.product_id,
        amount: p.amount,
      };
    });
    ordersActions.create(orderInfo, (orderId) => {
      cartActions.clear(auth.token);
      navigator.push({
        screen: 'CheckoutComplete',
        backButtonTitle: '',
        backButtonHidden: true,
        passProps: {
          orderId: orderId.order_id,
        }
      });
    });
    return null;
  }

  placePayPalOrder() {
    const { cart, auth, shipping_id, ordersActions, navigator, paymentsActions } = this.props;
    const orderInfo = {
      products: {},
      shipping_id,
      payment_id: this.state.selectedItem.payment_id,
      user_data: cart.user_data,
    };
    Object.keys(cart.products).map((key) => {
      const p = cart.products[key];
      orderInfo.products[p.product_id] = {
        product_id: p.product_id,
        amount: p.amount,
      };
    });
    ordersActions.create(orderInfo, (orderId) => {
      console.log(orderId);
      paymentsActions.paypalSettlements(orderId.order_id, false);
      // navigator.push({
      //   screen: 'PayPalCompleteWebView',
      //   backButtonTitle: '',
      //   backButtonHidden: true,
      //   passProps: {
      //     orderId: orderId.order_id,
      //   }
      // });
    });
    return null;
  }

  renderItem = (item, index) => {
    // FIXME compare by name.
    const isSelected = item.payment === this.state.selectedItem.payment;
    return (
      <TouchableOpacity
        style={styles.paymentItem}
        onPress={() => {
          this.setState({
            selectedItem: item,
          }, () => {
            this.listView.scrollToOffset({ x: 0, y: 0, animated: true });
          });
        }}
      >
        {isSelected ?
          <Image source={require('../assets/icons/check-circle-o.png')} style={styles.uncheckIcon} /> :
          <Image source={require('../assets/icons/circle-o.png')} style={styles.checkIcon} />
        }
        <Text style={styles.paymentItemText}>
          {item.description}
        </Text>
      </TouchableOpacity>
    );
  }

  renderHeader() {
    const { selectedItem } = this.state;
    if (!selectedItem) {
      return null;
    }
    let form = null;
    // FIXME: HARDCOD
    switch (selectedItem.payment) {
      case PAYMENT_CREDIT_CARD:
        form = (
          <PaymentCreditCardForm
            onInit={(ref) => {
              this.paymentFormRef = ref;
            }}
          />
        );
        break;
      case PAYMENT_CHECK:
        form = (
          <PaymentCheckForm
            onInit={(ref) => {
              this.paymentFormRef = ref;
            }}
          />
        );
        break;
      case PAYMENT_PAYPAL_EXPRESS:
        form = (
          <PaymentPaypalForm
            onInit={(ref) => {
              this.paymentFormRef = ref;
            }}
          />
        );
        break;
      default:
        form = (
          <PaymentPhoneForm
            onInit={(ref) => {
              this.paymentFormRef = ref;
            }}
          />
        );
        break;
    }

    return (
      <View>
        <CheckoutSteps step={3} />
        <FormBlock
          title={selectedItem.payment}
        >
          {form}
          <Text style={styles.paymentItemDesc}>
            {stripTags(selectedItem.instructions)}
          </Text>
        </FormBlock>
      </View>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <FlatList
          ref={ref => this.listView = ref}
          contentContainerStyle={styles.contentContainer}
          ListHeaderComponent={() => this.renderHeader()}
          data={this.state.items}
          keyExtractor={(item, index) => index}
          numColumns={1}
          renderItem={({ item, index }) => this.renderItem(item, index)}
        />
        <CartFooter
          totalPrice={formatPrice(this.state.total)}
          btnText={i18n.gettext('Place order').toUpperCase()}
          isBtnDisabled={false}
          onBtnPress={() => this.handlePlaceOrder()}
        />
      </View>
    );
  }
}

export default connect(state => ({
  cart: state.cart,
  auth: state.auth,
}),
dispatch => ({
  ordersActions: bindActionCreators(ordersActions, dispatch),
  cartActions: bindActionCreators(cartActions, dispatch),
  paymentsActions: bindActionCreators(paymentsActions, dispatch),
})
)(CheckoutStepThree);
