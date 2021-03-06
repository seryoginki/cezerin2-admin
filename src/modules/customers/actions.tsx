import api from "../../lib/api"
import * as t from "./actionTypes"
const push = () => {}

function requestCustomer() {
  return {
    type: t.CUSTOMERS_DETAIL_REQUEST,
  }
}

function receiveCustomer(item) {
  return {
    type: t.CUSTOMERS_DETAIL_RECEIVE,
    item,
  }
}

export function clearCustomerDetails() {
  return receiveCustomer(null)
}

function requestCustomers() {
  return {
    type: t.CUSTOMERS_REQUEST,
  }
}

function requestMoreCustomers() {
  return {
    type: t.CUSTOMERS_MORE_REQUEST,
  }
}

function receiveCustomersMore({ has_more, total_count, data }) {
  return {
    type: t.CUSTOMERS_MORE_RECEIVE,
    has_more,
    total_count,
    data,
  }
}

function receiveCustomers({ has_more, total_count, data }) {
  return {
    type: t.CUSTOMERS_RECEIVE,
    has_more,
    total_count,
    data,
  }
}

function receiveCustomersError(error) {
  return {
    type: t.CUSTOMERS_FAILURE,
    error,
  }
}

export function selectCustomer(id) {
  return {
    type: t.CUSTOMERS_SELECT,
    customerId: id,
  }
}

export function deselectCustomer(id) {
  return {
    type: t.CUSTOMERS_DESELECT,
    customerId: id,
  }
}

export function deselectAllCustomer() {
  return {
    type: t.CUSTOMERS_DESELECT_ALL,
  }
}

export function selectAllCustomer() {
  return {
    type: t.CUSTOMERS_SELECT_ALL,
  }
}

export function setFilterSearch(value) {
  return {
    type: t.CUSTOMERS_FILTER_SET_SEARCH,
    search: value,
  }
}

function deleteCustomersSuccess() {
  return {
    type: t.CUSTOMER_DELETE_SUCCESS,
  }
}

function setGroupSuccess() {
  return {
    type: t.CUSTOMER_SET_GROUP_SUCCESS,
  }
}

function createCustomerSuccess() {
  return {
    type: t.CUSTOMER_CREATE_SUCCESS,
  }
}

const getFilter = (state, offset = 0) => {
  const filter = {
    limit: 50,
    offset,
  }

  if (state.customers.search && state.customers.search !== "") {
    filter.search = state.customers.search
  }

  if (state.customerGroups.selectedId) {
    filter.group_id = state.customerGroups.selectedId
  }

  return filter
}

export function fetchCustomers() {
  return (dispatch, getState) => {
    const state = getState()
    if (!state.customers.loadingItems) {
      dispatch(requestCustomers())
      dispatch(deselectAllCustomer())

      const filter = getFilter(state)

      return api.customers
        .list(filter)
        .then(({ status, json }) => {
          dispatch(receiveCustomers(json))
        })
        .catch(error => {
          dispatch(receiveCustomersError(error))
        })
    }
  }
}

export function fetchMoreCustomers() {
  return (dispatch, getState) => {
    const state = getState()
    if (!state.customers.loadingItems) {
      dispatch(requestMoreCustomers())

      const filter = getFilter(state, state.customers.items.length)

      return api.customers
        .list(filter)
        .then(({ status, json }) => {
          dispatch(receiveCustomersMore(json))
        })
        .catch(error => {
          dispatch(receiveCustomersError(error))
        })
    }
  }
}

export function createDraftCustomer(ownProps) {
  const defaultEmail = "temporary.email@localhost"
  const firstName = "Joe"
  const lastName = "Doe"

  let filter = {
    limit: 50,
    offset: 0,
    search: defaultEmail,
  }

  return (dispatch, getState) => {
    const state = getState()
    api.customers
      .list(filter)
      .then(lookupResponse => {
        // check if temporary user in the system
        let customer =
          lookupResponse.json.data.length > 0 ? lookupResponse.json.data[0] : {}

        if (Object.keys(customer).length === 0) {
          // Found no default user --> create
          return api.customers
            .create({
              full_name: `${firstName} ${lastName}`,
              first_name: firstName,
              last_name: lastName,
              email: defaultEmail,
            })
            .catch(error => {
              console.log(error)
            })
        } else {
          return customer
        }
      })
      .then(customerResponse => {
        let draftCustomerId
        // Case customer object
        if (customerResponse.hasOwnProperty("id")) {
          draftCustomerId = customerResponse.id
        } else {
          draftCustomerId = customerResponse.json.id
        }

        dispatch(createCustomerSuccess())
        ownProps.history.push(`/customer/${draftCustomerId}`)
      })
      .catch(error => {
        console.log(error)
      })
  }
}

export function editCustomer(ownProps) {
  return (dispatch, getState) => {
    const state = getState()
    // When editing, you only selected single item. No bulk edit
    if (state.customers.selected) {
      ownProps.history.push(`/customer/${state.customers.selected}`)
    }
  }
}

export function deleteCustomers() {
  return (dispatch, getState) => {
    const state = getState()
    const promises = state.customers.selected.map(customerId =>
      api.customers.delete(customerId)
    )

    return Promise.all(promises)
      .then(values => {
        dispatch(deleteCustomersSuccess())
        dispatch(deselectAllCustomer())
        dispatch(fetchCustomers())
      })
      .catch(err => {})
  }
}

export function deleteCurrentCustomer() {
  return (dispatch, getState) => {
    const state = getState()
    const customer = state.customers.editCustomer

    if (customer && customer.id) {
      return api.customers.delete(customer.id).catch(err => {
        console.log(err)
      })
    }
  }
}

export function setGroup(group_id) {
  return (dispatch, getState) => {
    const state = getState()
    const promises = state.customers.selected.map(customerId =>
      api.customers.update(customerId, { group_id })
    )

    return Promise.all(promises)
      .then(values => {
        dispatch(setGroupSuccess())
        dispatch(deselectAllCustomer())
        dispatch(fetchCustomers())
      })
      .catch(err => {})
  }
}

export function updateCustomer(data) {
  return (dispatch, getState) =>
    api.customers
      .update(data.id, data)
      .then(customerResponse => {
        dispatch(receiveCustomer(customerResponse.json))
      })
      .catch(error => {})
}

export function fetchCustomer(customerId) {
  return (dispatch, getState) => {
    dispatch(requestCustomer())

    return api.customers
      .retrieve(customerId)
      .then(customerResponse => {
        dispatch(receiveCustomer(customerResponse.json))
      })
      .catch(error => {})
  }
}

export function updateAddress(customerId, addressId, data) {
  return (dispatch, getState) =>
    api.customers
      .updateAddress(customerId, addressId, data)
      .then(customerResponse => {
        dispatch(fetchCustomer(customerId))
      })
      .catch(error => {})
}

export function deleteAddress(customerId, addressId) {
  return (dispatch, getState) =>
    api.customers
      .deleteAddress(customerId, addressId)
      .then(customerResponse => {
        dispatch(fetchCustomer(customerId))
      })
      .catch(error => {})
}

export function setDefaultBillingAddress(customerId, addressId) {
  return (dispatch, getState) =>
    api.customers
      .setDefaultBillingAddress(customerId, addressId)
      .then(customerResponse => {
        dispatch(fetchCustomer(customerId))
      })
      .catch(error => {})
}

export function setDefaultShippingAddress(customerId, addressId) {
  return (dispatch, getState) =>
    api.customers
      .setDefaultShippingAddress(customerId, addressId)
      .then(customerResponse => {
        dispatch(fetchCustomer(customerId))
      })
      .catch(error => {})
}
