import React from 'react'

import { Client, defaultExchanges, Provider, subscriptionExchange, useQuery, useSubscription } from 'urql'
import { SubscriptionClient } from 'subscriptions-transport-ws'

const TASKRUNNER_API_HOST = "localhost:3001"

const subscriptionClient = new SubscriptionClient(`ws://${TASKRUNNER_API_HOST}/graphql`, { reconnect: true });

// https://formidable.com/open-source/urql/docs/advanced/subscriptions/#setting-up-subscriptions-transport-ws
const client = new Client({
  url: `//${TASKRUNNER_API_HOST}/graphql`,
  exchanges: [
    ...defaultExchanges,
    subscriptionExchange({
      forwardSubscription(operation) {
        return subscriptionClient.request(operation)
      },
    }),
  ],
});

const watchUpdatesSubscription = `
  subscription {
    watchUpdates
  }
`

const someQuery = `
  query {
    hello
  }
`

function TaskrunnerExample() {
  // https://formidable.com/open-source/urql/docs/basics/queries/#run-a-first-query
  const [result, reexecuteQuery] = useQuery({ query: someQuery })
  const { data, fetching, error } = result

  // https://formidable.com/open-source/urql/docs/advanced/subscriptions/#react--preact
  const [res] = useSubscription({ query: watchUpdatesSubscription }, (data = [], evt) => {
    // reexecuteQuery here causes `someQuery` to be re-run
    reexecuteQuery({ requestPolicy: 'network-only' })

    return [evt.watchUpdates, ...data]
  })

  if (res.error) {
    return <p>{res.error}</p>
  }
  if (error) {
    return <p>{error}</p>
  }

  if (!res.data) {
    return <p>No data yet.</p>
  }

  return (
    <>
      <div>New data: {data.hello}</div>
      <ul>
        {res.data.map((evt: string, i: number) => (
          <li key={i}>
            {evt}
          </li>
        ))}
      </ul>
    </>
  )
}

function App() {
  return (
    <Provider value={client}>
      <TaskrunnerExample />
    </Provider>
  )
}

export default App
