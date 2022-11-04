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

type ListContext = {
    firstList: {
        currentPageNumber: number;
        values: Value[];
        search: string;
    },
    selectedValue: undefined | string;
}

type ListEvent = { type: 'SEARCH'; search: string; }
    | { type: 'LOAD_MORE' }
    | { type: 'SELECT_VALUE'; value: string; }


const listMachine = createMachine<ListContext, ListEvent>({
    predictableActionArguments: true,
    context: {
        firstList: {
            currentPageNumber: 0,
            values: [] as Value[],
            search: '',
        },

        selectedValue: undefined,
    },
    initial: 'loading',
    states: {
        loading: {
            invoke: {
                src: (context) => {
                    return fakeAPI({ search: context.firstList.search, page: 0 });
                },
                onDone: {
                    target: 'ready',
                    actions: assign((_, event) => ({
                        firstList: {
                            values: event.data,
                            currentPageNumber: 0,
                            search: '',
                        },
                        selectedValue: undefined,
                    })),
                }
            },
        },
        loadingMore: {
            invoke: {
                src: (context) => {
                    return fakeAPI({ search: context.firstList.search, page: ++context.firstList.currentPageNumber });
                },
                onDone: {
                    target: 'ready',
                    // FIXME bad typing, context not infered
                    actions: assign((context: any, event) => ({
                        firstList: {
                            values: context.firstList.values.concat(event.data),
                            currentPageNumber: ++context.firstList.currentPageNumber,
                        }
                    })),
                }
            },
        },
        ready: {
            on: {
                SEARCH: {
                    actions: (context, event) => {
                        context.firstList.search = event.search;
                    },
                    target: 'loading'
                },
                LOAD_MORE: 'loadingMore',
                SELECT_VALUE: 'valueSelected',
            },
        },
        valueSelected: {
            entry: (context, event) => {
                // Because of TS error https://xstate.js.org/docs/guides/typescript.html#event-types-in-entry-actions
                if (event.type !== 'SELECT_VALUE') {
                    return;
                }

                context.selectedValue = event.value;
            },
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
    const [state, send] = useMachine(listMachine);
    const isLoading = state.matches('loading');
    const isLoadingMore = state.matches('loadingMore');

    console.log('hereeee', state.context.firstList.values);

    return (
        <div>
            <div>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} />
                <button type="button" onClick={() => {
                    send('SEARCH', { search });
                }}>Submit</button>
            </div>
            {isLoading ?
                <p>Loading....</p> :
                <>
                    <ul>
                        {state.context.firstList.values.map((value) => (
                            <li
                                key={value.code}
                                style={{ cursor: 'pointer', color: value.code === state.context.selectedValue ? 'red' : 'black' }}
                                onClick={() => {
                                    send('SELECT_VALUE', { value: value.code });
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
