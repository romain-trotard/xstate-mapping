import './App.css'
import { useMachine } from '@xstate/react';
import { createMachine, assign } from 'xstate';
import { useState } from 'react';

type Value = {
    code: string;
    label: string;
}

const VALUES = [
    { code: 'one', label: 'one' },
    { code: 'two', label: 'two' },
    { code: 'three', label: 'three' }
];

function fakeAPI({ search = '', page = 0 }: { search?: string, page?: number } = {}) {
    return new Promise<Value[]>(resolve => {
        setTimeout(() => {
            resolve(VALUES.map(value => (
                {
                    code: `${search}${value.code}${page}`,
                    label: `${search}${value.label}${page}`
                }
            )));
        }, 2000);
    });
}

const toggleMachine = createMachine({
    predictableActionArguments: true,
    id: 'toggle',
    context: {
        currentPageNumber: 0,
        selectedValue: undefined,
        values: [] as Value[],
        search: '',
    },
    initial: 'loading',
    states: {
        loading: {
            invoke: {
                src: (_, event) => {
                    return fakeAPI({ search: event.data, page: 0 });
                },
                onDone: {
                    target: 'ready',
                    actions: assign({ values: (_: any, event) => event.data, currentPageNumber: 0 }),
                }
            },
        },
        loadingMore: {
            invoke: {
                src: (context) => {
                    return fakeAPI({ search: context.search, page: ++context.currentPageNumber });
                },
                onDone: {
                    target: 'ready',
                    actions: assign({
                        values: (context: any, event) => context.values.concat(event.data),
                        currentPageNumber: (context) => ++context.currentPageNumber,
                    }),
                }
            },
        },
        ready: {
            on: {
                SEARCH: {
                    actions: (context, event) => {
                        context.search = event.data;
                    },
                    target: 'loading'
                },
                LOAD_MORE: 'loadingMore',
                SELECT_VALUE: 'valueSelected',
            },
        },
        valueSelected: {
            // FIXME rtr the typing here is really bad
            entry: assign({ selectedValue: (_, event: { data: string }) => event.data }),
            // Transient transition, in this case we do not see the state `valueSelected` in the component
            // Goes directly to `ready`
            on: {
                '': 'ready'
            },
        },
    },
});

function App() {
    const [search, setSearch] = useState('');
    const [state, send] = useMachine(toggleMachine);
    const isLoading = state.matches('loading');
    const isLoadingMore = state.matches('loadingMore');

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
                <>
                    <ul>
                        {state.context.values.map((value) => (
                            <li
                                key={value.code}
                                style={{ cursor: 'pointer', color: value.code === state.context.selectedValue ? 'red' : 'black' }}
                                onClick={() => {
                                    send('SELECT_VALUE', { data: value.code });
                                }}>
                                {value.label}
                            </li>
                        ))}
                    </ul>
                    {isLoadingMore ?
                        <p>Loading more...</p> :
                        <button type="button" onClick={() => {
                            send('LOAD_MORE');
                        }}>Load more</button>
                    }
                </>
            }
        </div>
    );
}

export default App
