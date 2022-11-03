import './App.css'
import { useMachine } from '@xstate/react';
import { createMachine, assign } from 'xstate';
import { useState } from 'react';

const VALUES = ['one', 'two', 'three'];

function fakeAPI(search: string = '') {
    return new Promise<string[]>(resolve => {
        setTimeout(() => {
            resolve(VALUES.map(value => `${search}${value}`));
        }, 2000);
    });
}

const toggleMachine = createMachine({
    predictableActionArguments: true,
    id: 'toggle',
    context: {
        selectedValues: undefined,
        values: [],
    },
    initial: 'loading',
    states: {
        loading: {
            invoke: {
                src: (_, event) => {
                    return fakeAPI(event.data);
                },
                onDone: {
                    target: 'loaded',
                    actions: assign({ values: (_: any, event) => event.data }),
                }
            },
        },
        loaded: {
            on: {
                SEARCH: 'loading',
            },
        },
        valueSelected: {
            entry: () => {
                console.log('value selected');
            },
        },
    },
});

function App() {
    const [search, setSearch] = useState('');
    const [state, send] = useMachine(toggleMachine);
    const isLoading = state.matches('loading');

    return (
        <div>
            <div>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} />
                <button type="button" onClick={() => {
                    send('SEARCH', { data: search });
                }}>Submit</button>
            </div>
            {isLoading ?
                <p>Loading....</p> :
                <ul>
                    {state.context.values.map((value, index) => (
                        <li key={index}>{value}</li>
                    ))}
                </ul>}
        </div>
    );
}

export default App
