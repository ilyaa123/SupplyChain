// SPDX-License-Identifier: UNLISTENED

pragma solidity ^0.8.19;

contract SourceRegistry {
    bytes32 public sourceId;

    mapping(bytes32 => string) private sources;

    event SourceAdded(bytes32 indexed id);
    event SourceRemoved(bytes32 indexed id);
    event SourceUpdated(bytes32 indexed id);

    function _setActiveSource(bytes32 _sourceId) internal virtual {
        sourceId = _sourceId;
    }

    function _addSource(bytes32 _id, string calldata _sourceCode) internal virtual {
        require(bytes(sources[_id]).length == 0, "Source already exists");
        sources[_id] = _sourceCode;
        emit SourceAdded(_id);
    }

    function _updateSource(bytes32 _id, string calldata _sourceCode) internal virtual {
        require(bytes(sources[_id]).length != 0, "Source does not exist");
        sources[_id] = _sourceCode;
        emit SourceUpdated(_id);
    }

    function _removeSource(bytes32 _id) internal virtual {
        require(bytes(sources[_id]).length != 0, "Source does not exist");
        delete sources[_id];
        emit SourceRemoved(_id);
    }

    function getSource(bytes32 _id) public view returns (string memory) {
        return sources[_id];
    }
}
