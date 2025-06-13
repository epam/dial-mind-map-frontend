import { IconX } from '@tabler/icons-react';
import differenceWith from 'lodash-es/differenceWith';
import isEqual from 'lodash-es/isEqual';
import { useEffect, useState } from 'react';
import Select, { components, MultiValue } from 'react-select';

import { BuilderActions } from '@/store/builder/builder/builder.reducers';
import { GraphSelectors } from '@/store/builder/graph/graph.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { Edge, EdgeDirectionType, EdgeType, Node } from '@/types/graph';
import { getEdgeId } from '@/utils/app/graph/common';
import { isEdge } from '@/utils/app/graph/typeGuards';

import { findClosestNeighbors } from '../../graph/GraphComponent/utils/graph/findClosestNeighbors';

export interface ConnectionSelectOption {
  value: string;
  label: string;
  type?: EdgeType;
  edgeId: string;
}

export function ConnectionsSelector({ type }: { type: EdgeDirectionType }) {
  const dispatch = useBuilderDispatch();
  const elements = useBuilderSelector(GraphSelectors.selectElements);
  const focusNodeId = useBuilderSelector(GraphSelectors.selectFocusNodeId);
  const areGeneretedEdgesShowen = useBuilderSelector(UISelectors.selectAreGeneretedEdgesShowen);
  const [connections, setConnections] = useState<ConnectionSelectOption[]>([]);
  const [allConnections, setAllConnection] = useState<ConnectionSelectOption[]>([]);

  useEffect(() => {
    if (focusNodeId) {
      const neighbors = findClosestNeighbors(elements, focusNodeId, type);
      const options = mapNeighborsToOptions(neighbors, areGeneretedEdgesShowen);
      const neighborIds = neighbors.map(n => n.node.id);

      const potential = elements
        .filter(el => !isEdge(el.data) && !neighborIds.includes(el.data.id) && el.data.id !== focusNodeId)
        .map(
          el =>
            ({
              label: (el.data as Node).label,
              value: el.data.id,
            }) as ConnectionSelectOption,
        );

      setConnections(options);
      setAllConnection(potential);
    }
  }, [focusNodeId, elements, areGeneretedEdgesShowen, type]);

  return (
    <Select
      id={`node-${type}-connections`}
      isMulti
      onFocus={() => {
        setTimeout(() => {
          const element = document.getElementById('node-connections');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }}
      onChange={(newValue: MultiValue<ConnectionSelectOption>) => {
        const neighbors = mapNeighborsToOptions(
          findClosestNeighbors(elements, focusNodeId, type),
          areGeneretedEdgesShowen,
        );
        const newNeighbors = differenceWith(newValue, neighbors, isEqual);
        if (newNeighbors.length === 1) {
          const newNeighborId = newNeighbors[0].value;

          let source = focusNodeId;
          let target = newNeighborId;
          if (type === EdgeDirectionType.Inbound) {
            source = newNeighborId;
            target = focusNodeId;
          }

          dispatch(
            BuilderActions.createEdge({
              id: getEdgeId(focusNodeId, newNeighborId),
              source,
              target,
            }),
          );
        } else if (newNeighbors.length > 1) {
          console.warn('Unexpected amount of new neighbors!');
        }

        const deletedNeighbors = differenceWith(neighbors, newValue, isEqual);
        if (deletedNeighbors.length === 1) {
          dispatch(BuilderActions.deleteEdge(deletedNeighbors[0].edgeId));
        } else if (deletedNeighbors.length > 1) {
          console.warn('Unexpected amount of deleted neighbors!');
        }

        setConnections(newValue as ConnectionSelectOption[]);
      }}
      closeMenuOnSelect={false}
      name="colors"
      options={allConnections}
      value={connections}
      components={{
        MultiValueRemove: props => (
          <components.MultiValueRemove
            {...props}
            innerProps={{
              ...props.innerProps,
              style: {
                ...props.innerProps.style,
                backgroundColor: 'transparent',
              },
              className: 'group',
            }}
          >
            <IconX className="cursor-pointer text-secondary group-hover:text-accent-primary" size={16} />
          </components.MultiValueRemove>
        ),
      }}
      styles={{
        container: styles => ({
          ...styles,
          width: '100%',
        }),
        input: styles => ({
          ...styles,
          height: '21px',
          padding: 0,
          margin: 0,
          color: 'var(--text-primary)',
        }),
        menu: styles => ({ ...styles, margin: 0 }),
        menuList: styles => ({
          ...styles,
          margin: 0,
          padding: 0,
          backgroundColor: 'var(--bg-layer-0)',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }),
        option: styles => ({
          ...styles,
          WebkitTapHighlightColor: 'var(--bg-layer-2)',
          backgroundColor: '',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          cursor: 'pointer',
          ':hover': {
            backgroundColor: 'var(--bg-layer-2)',
          },
        }),
        multiValue: (styles, state) => ({
          ...styles,
          height: '100%',
          backgroundColor: 'var(--bg-layer-2)',
          borderWidth: '1px',
          borderRadius: '8px',
          borderStyle: state.data.type === 'Generated' ? 'dashed' : 'solid',
          borderColor: 'var(--text-secondary)',
          padding: '0 8px',
        }),
        multiValueLabel: styles => ({
          ...styles,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '0 4px',
          color: 'var(--text-primary)',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }),
        valueContainer: styles => ({
          ...styles,
          padding: '4px',
          gap: '2px',
        }),
        placeholder: styles => ({
          ...styles,
          color: 'var(--text-secondary)',
          margin: 0,
        }),
        noOptionsMessage: styles => ({
          ...styles,
          textAlign: 'start',
        }),
        control: (styles, { hasValue, isFocused }) => ({
          ...styles,
          paddingLeft: hasValue ? 0 : '8px',
          display: 'flex',
          cursor: 'text',
          backgroundColor: 'bg-transparent',
          boxShadow: 'none',
          transition: 'all 0',
          borderColor: isFocused ? 'var(--stroke-accent-primary) !important' : 'transparent',
          borderRadius: 3,
          ':hover': {
            borderColor: 'var(--stroke-primary)',
          },
        }),
        dropdownIndicator: styles => ({
          ...styles,
          display: 'none',
        }),
        indicatorSeparator: styles => ({
          ...styles,
          display: 'none',
        }),
        indicatorsContainer: styles => ({
          ...styles,
          display: 'none',
        }),
      }}
    />
  );
}

function mapNeighborsToOptions(
  neighbors: {
    node: Node;
    edge: Edge;
  }[],
  areGeneretedEdgesShowen: boolean,
): ConnectionSelectOption[] {
  return neighbors
    .filter(n => areGeneretedEdgesShowen || n.edge.type !== 'Generated')
    .map(
      n =>
        ({
          label: n.node.label,
          value: n.node.id,
          type: n.edge.type,
          edgeId: n.edge.id,
        }) as ConnectionSelectOption,
    )
    .sort((a, b) => {
      const edgeTypeOrder = (type?: EdgeType) => {
        switch (type) {
          case 'Manual':
            return 1;
          case 'Init':
            return 2;
          default:
            return 3;
        }
      };

      return edgeTypeOrder(a.type) - edgeTypeOrder(b.type);
    });
}
