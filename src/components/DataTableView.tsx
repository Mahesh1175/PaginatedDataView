import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import 'primeicons/primeicons.css';

interface PaginatedData {
    id: number;
    title: string;
    place_of_origin: string;
    artist_display: string;
    inscriptions:string;
    date_start: string;
    date_end: string;
}

const DataTableView: React.FC = () => {
    const [pagiData, setPagiData] = useState<PaginatedData[]>([]); //Current page data
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [checkedRows, setCheckedRows] = useState<Record<number, boolean>>({});
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [remainingChecks, setRemainingChecks] = useState(0);
    const [headerValue, setHeaderValue] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const op = useRef<OverlayPanel>(null);

    // Fetch data for a specific page
    const fetchData = async (page: number) => {
        try {
            setLoading(true);
            const url = `https://api.artic.edu/api/v1/artworks?page=${page}`;
            const response = await fetch(url);
            const { data, pagination } = await response.json();
            setPagiData(data.map((item: any) => ({
                id: item.id,
                title: item.title,
                place_of_origin: item.place_of_origin,
                artist_display: item.artist_display,
                inscriptions:item.inscriptions,
                date_start: item.date_start || '',
                date_end: item.date_end || ''
            })));
            setTotalPages(pagination.total_pages);
            if (remainingChecks > 0) handleRemainingSelection(data); // check if there are remaining rows to select
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data whenever currentPage changes
    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage]);

    const onPageChange = (e: any) => {
        setFirst(e.first);
        setRows(e.rows);
        setCurrentPage(e.page + 1);
    };

    const toggleCheckbox = (id: number, isChecked: boolean) => {
        setCheckedRows(prev => ({ ...prev, [id]: isChecked }));
    };

    // Centralized row selection logic
    const selectRows = (data: PaginatedData[], remaining: number) => {
        const updatedChecked = { ...checkedRows };

        data.forEach(row => {
            if (remaining > 0) {
                updatedChecked[row.id] = true;
                remaining--;
            }
        });

        setCheckedRows(updatedChecked);
        return remaining; 
    };

    // Handle submission from the overlay panel
    const submitHeader = () => {
        if (headerValue !== null && headerValue > 0) {
            let remaining = headerValue;

            // Update checked rows
            remaining = selectRows(pagiData, remaining);
            setRemainingChecks(remaining);

            // Move to the next page if there are still remaining rows to check
            if (remaining > 0 && currentPage < totalPages) {
                setCurrentPage(currentPage + 1);
            } else {
                setRemainingChecks(0);
            }
        }
        op.current?.hide();
    };

    // Handle remaining checks across pages
    const handleRemainingSelection = (data: PaginatedData[]) => {
        let remaining = selectRows(data, remainingChecks); 
        setRemainingChecks(remaining);

        // If still more rows to check, go to the next page
        if (remaining > 0 && currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        } else {
            setRemainingChecks(0);
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <>
            <DataTable value={pagiData} stripedRows>
                <Column
                    header={<Checkbox checked={pagiData.every(row => checkedRows[row.id])} onChange={e => pagiData.forEach(row => toggleCheckbox(row.id, e.checked || false))} />}
                    body={(rowData: PaginatedData) => (
                        <Checkbox checked={checkedRows[rowData.id] || false} onChange={e => toggleCheckbox(rowData.id, e.checked || false)} />
                    )}
                />
                <Column
                    field="title"
                    header={
                        <>
                            <div onClick={e => op.current?.toggle(e)} className="p-d-flex p-ai-center">
                                <i className="pi pi-angle-down" style={{ marginRight: '4px' }}></i> Title
                            </div>
                            <OverlayPanel ref={op}>
                                <div className="p-inputgroup">
                                    <InputNumber value={headerValue} onValueChange={e => setHeaderValue(e.value || null)} min={0} placeholder="Enter number" />
                                    <Button label="Submit" onClick={submitHeader} />
                                </div>
                            </OverlayPanel>
                        </>
                    }
                />
                <Column field="place_of_origin" header="Place of Origin" />
                <Column field="artist_display" header="Artist" />
                <Column field="inscriptions" header="Inscriptions" />
                <Column field="date_start" header="Start Date" />
                <Column field="date_end" header="End Date" />
            </DataTable>
            <div className="card"><Paginator first={first} rows={rows} totalRecords={totalPages} onPageChange={onPageChange} /></div>
        </>
    );
};

export default DataTableView;
