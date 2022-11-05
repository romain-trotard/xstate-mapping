import { useState } from "react";
import css from './List.module.css';
import clsx from 'clsx';

type Item = {
    code: string;
    label: string;
}

export default function List({
    onSearch,
    loading,
    loadingMore,
    items,
    onSelect,
    selectedValue,
    loadMore,
}: {
    onSearch: (search: string) => void;
    loading: boolean;
    loadingMore: boolean;
    items: Item[];
    onSelect: (code: string) => void;
    selectedValue?: string;
    loadMore: () => void;
}) {
    const [search, setSearch] = useState('');

    return (
        <div className={css.listContainer}>
            <div className={css.search}>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} />
                <button type="button" onClick={() => onSearch(search)}>Submit</button>
            </div>
            {loading ?
                <p>Loading....</p> :
                <>
                    <div className={css.list}>
                        {items.map((value) => (
                            <button
                                key={value.code}
                                className={clsx(css.item, value.code === selectedValue && css.selectedItem)}
                                onClick={() => onSelect(value.code)}>
                                {value.label}
                            </button>
                        ))}
                    </div>
                    {loadingMore ?
                        <p>Loading more...</p> :
                        <button className={css.loadMore} type="button" onClick={loadMore}>Load more</button>
                    }
                </>
            }
        </div>
    );
}
