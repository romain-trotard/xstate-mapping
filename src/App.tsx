import './App.css'
import css from './App.module.css';
import { useMachine } from '@xstate/react';
import { createMachine, assign } from 'xstate';
import List from './components/List';
import { useEffect, useState } from 'react';

type Value = {
    code: string;
    label: string;
}

const VALUES = [
    { code: 'one', label: 'one' },
    { code: 'two', label: 'two' },
    { code: 'three', label: 'three' }
];

async function fetchCategories({ page = 0 }: { page: number }) {
    const call = await fetch('http://localhost:3000/categories?' + new URLSearchParams({ pageNumber: page.toString() }));
    return call.json();
}

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

function mapBothValues(firstValue: string, secondValue: string) {
    return new Promise<string>(resolve => {
        setTimeout(() => {
            resolve(`Values "${firstValue}" and "${secondValue}" have been mapped`);
        }, 500);
    });
}

type ListContext = {
    firstList: {
        currentPageNumber: number;
        values: Value[];
        search: string;
    },
    secondList: {
        nextPage: number;
        values: Value[];
        search: string;
    },
    firstListSelectedValue: undefined | string;
    secondListSelectedValue: undefined | string;
}

type ListEvent = { type: 'SEARCH_FIRST_LIST'; search: string; }
    | { type: 'LOAD_MORE_FIRST_LIST' }
    | { type: 'SELECT_VALUE_FIRST_LIST'; value: string; }
    | { type: 'SEARCH_SECOND_LIST'; search: string; }
    | { type: 'LOAD_MORE_SECOND_LIST' }
    | { type: 'SELECT_VALUE_SECOND_LIST'; value: string; }



const listMachine = createMachine<ListContext, ListEvent>({
    predictableActionArguments: true,
    type: 'parallel',
    context: {
        firstList: {
            currentPageNumber: 0,
            values: [] as Value[],
            search: '',
        },
        secondList: {
            nextPage: 0,
            values: [] as Value[],
            search: '',
        },

        firstListSelectedValue: undefined,
        secondListSelectedValue: undefined,
    },
    states: {
        firstList: {
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
                        SEARCH_FIRST_LIST: {
                            actions: (context, event) => {
                                context.firstList.search = event.search;
                            },
                            target: 'loading'
                        },
                        LOAD_MORE_FIRST_LIST: 'loadingMore',
                    },
                },
            }
        },
        secondList: {
            initial: 'loading',
            states: {
                loading: {
                    invoke: {
                        src: (context) => {
                            // return fakeAPI({ search: context.secondList.search, page: 0 });
                            return fetchCategories({ page: 0 });
                        },
                        onDone: {
                            target: 'ready',
                            actions: assign((_, event) => ({
                                secondList: {
                                    values: event.data.values,
                                    nextPage: event.data.nextPage,
                                    search: '',
                                },
                            })),
                        }
                    },
                },
                loadingMore: {
                    invoke: {
                        src: (context) => {
                            // return fakeAPI({ search: context.secondList.search, page: ++context.secondList.currentPageNumber });
                            return fetchCategories({ page: context.secondList.nextPage });
                        },
                        onDone: {
                            target: 'ready',
                            // FIXME bad typing, context not infered
                            actions: assign((context: any, event) => ({
                                secondList: {
                                    values: context.secondList.values.concat(event.data.values),
                                    currentPageNumber: ++context.secondList.currentPageNumber,
                                    nextPage: event.data.nextPage,
                                }
                            })
                            ),
                        }
                    },
                },
                ready: {
                    on: {
                        SEARCH_SECOND_LIST: {
                            actions: (context, event) => {
                                context.secondList.search = event.search;
                            },
                            target: 'loading'
                        },
                        LOAD_MORE_SECOND_LIST: 'loadingMore',
                    },
                },
            }
        },
        selection: {
            initial: 'init',
            states: {
                init: {
                    on: {
                        SELECT_VALUE_FIRST_LIST: 'selectingValueFirstList',
                    }
                },
                selectingValueFirstList: {
                    entry: (context, event) => {
                        // Because of TS error https://xstate.js.org/docs/guides/typescript.html#event-types-in-entry-actions
                        if (event.type !== 'SELECT_VALUE_FIRST_LIST') {
                            return;
                        }

                        context.firstListSelectedValue = event.value;
                    },
                    // Transient transition, in this case we do not see the state `valueFirstListSelected` in the component
                    // Goes directly to `ready`
                    on: {
                        '': 'valueFirstListSelected'
                    },
                },
                valueFirstListSelected: {
                    on: {
                        SELECT_VALUE_FIRST_LIST: 'selectingValueFirstList',
                        SELECT_VALUE_SECOND_LIST: 'selectingValueSecondList',
                    }
                },
                selectingValueSecondList: {
                    entry: (context, event) => {
                        // Because of TS error https://xstate.js.org/docs/guides/typescript.html#event-types-in-entry-actions
                        if (event.type !== 'SELECT_VALUE_SECOND_LIST') {
                            return;
                        }

                        context.secondListSelectedValue = event.value;
                    },
                    invoke: {
                        src: (context) => {
                            // Trust me values are not undefined
                            // Should I do a guard later? maybe
                            return mapBothValues(context.firstListSelectedValue!, context.secondListSelectedValue!);
                        },
                        onDone: {
                            target: 'init',
                            // FIXME bad typing, context not infered
                            actions: [
                                'displayMessage',
                                (context) => {
                                    // Next I would probably want to select automagically the next value for this one
                                    context.firstListSelectedValue = undefined;
                                    context.secondListSelectedValue = undefined;
                                }
                            ],
                        }
                    },
                },
            }
        },
    },
});

function App() {
    const [message, setMessage] = useState<string | null>(null);
    const [state, send] = useMachine(listMachine, {
        actions: {
            displayMessage: (_, event) => {
                // @ts-ignore for now let's do like this then improve the TS
                setMessage(event.data);
            }
        }
    });

    const isLoadingFirstList = state.matches('firstList.loading');
    const isLoadingMoreFirstList = state.matches('firstList.loadingMore');

    const isLoadingSecondList = state.matches('secondList.loading');
    const isLoadingMoreSecondList = state.matches('secondList.loadingMore');
    const hasNextPageSecondList = state.context.secondList.nextPage !== undefined;

    const isFirstListValueSelected = state.matches('selection.valueFirstListSelected');


    useEffect(() => {
        if (message) {
            const timeout = setTimeout(() => setMessage(null), 2000);

            return () => clearTimeout(timeout);
        }
    }, [message]);

    return (
        <>
            {message && <div className={css.alert}>{message}</div>}
            <div className={css.listsContainer}>
                <List loadingMore={isLoadingMoreFirstList}
                    loading={isLoadingFirstList}
                    selectedValue={state.context.firstListSelectedValue}
                    loadMore={() => send('LOAD_MORE_FIRST_LIST')} onSearch={(search) => send('SEARCH_FIRST_LIST', { search })}
                    items={state.context.firstList.values}
                    hasNextPage={false}
                    onSelect={(value) => send('SELECT_VALUE_FIRST_LIST', { value: value })} />
                <List loadingMore={isLoadingMoreSecondList}
                    loading={isLoadingSecondList}
                    selectedValue={state.context.secondListSelectedValue}
                    loadMore={() => send('LOAD_MORE_SECOND_LIST')} onSearch={(search) => send('SEARCH_SECOND_LIST', { search })}
                    items={state.context.secondList.values}
                    selectable={isFirstListValueSelected}
                    hasNextPage={hasNextPageSecondList}
                    onSelect={(value) => send('SELECT_VALUE_SECOND_LIST', { value: value })} />
            </div>
        </>
    );
}

export default App
