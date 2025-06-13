/* eslint-disable @typescript-eslint/no-unused-vars */
import { UploadStatus } from '@epam/ai-dial-shared';
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { DialFile } from '@/types/files';
import { sortByName } from '@/utils/app/common';
import { constructPath } from '@/utils/app/file';
import { getFileRootId } from '@/utils/app/id';

import { BuilderRootState } from '..';

export interface FilesState {
  files: DialFile[];
  dialApiHost: string;
}

const initialState: FilesState = {
  files: [],
  dialApiHost: '',
};

export const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    uploadFile: (
      state,
      {
        payload,
      }: PayloadAction<{
        fileContent: File;
        id: string;
        relativePath?: string;
        name: string;
      }>,
    ) => {
      state.files = state.files.filter(file => file.id !== payload.id);
      state.files.push({
        id: payload.id,
        name: payload.name,
        relativePath: payload.relativePath,
        folderId: constructPath(getFileRootId(), payload.relativePath),

        status: UploadStatus.LOADING,
        percent: 0,
        fileContent: payload.fileContent,
        contentLength: payload.fileContent.size,
        contentType: payload.fileContent.type,
      });
    },
    uploadFileCancel: (
      state,
      _action: PayloadAction<{
        id: string;
      }>,
    ) => state,
    uploadFileSuccess: (
      state,
      {
        payload,
      }: PayloadAction<{
        apiResult: DialFile;
      }>,
    ) => {
      state.files = state.files.map(file => {
        return file.id === payload.apiResult.id ? payload.apiResult : file;
      });
    },
    uploadFileTick: (
      state,
      {
        payload,
      }: PayloadAction<{
        id: string;
        percent: number;
      }>,
    ) => {
      const updatedFile = state.files.find(file => file.id === payload.id);
      if (updatedFile) {
        updatedFile.percent = payload.percent;
      }
    },
    uploadFileFail: (
      state,
      {
        payload,
      }: PayloadAction<{
        id: string;
      }>,
    ) => {
      const updatedFile = state.files.find(file => file.id === payload.id);
      if (updatedFile) {
        updatedFile.status = UploadStatus.FAILED;
      }
    },
    deleteIcon: (
      state,
      _action: PayloadAction<{
        fileId: string;
        fileName: string;
      }>,
    ) => state,
    replaceIcon: (
      state,
      {
        payload,
      }: PayloadAction<{
        fileContent: File;
        id: string;
        relativePath?: string;
        name: string;
        nodeId: string;
        iconPath: string;
        iconNameToReplace?: string;
        iconFileIdToReplace?: string;
      }>,
    ) => state,
    deleteFile: (
      state,
      _action: PayloadAction<{
        fileId: string;
        fileName: string;
      }>,
    ) => state,
    deleteFileSuccess: (
      state,
      {
        payload,
      }: PayloadAction<{
        fileId: string;
      }>,
    ) => {
      state.files = state.files.filter(file => file.id !== payload.fileId);
    },
    deleteFileFail: (
      state,
      _action: PayloadAction<{
        fileName: string;
      }>,
    ) => state,
  },
});

const rootSelector = (state: BuilderRootState): FilesState => state.files;

const selectFiles = createSelector([rootSelector], state => {
  return sortByName([...state.files]);
});
const selectFilesByIds = createSelector([selectFiles, (_state, fileIds: string[]) => fileIds], (files, fileIds) => {
  return files.filter(file => fileIds.includes(file.id));
});
const selectFileById = createSelector([selectFiles, (_state, fileId: string) => fileId], (files, fileId) => {
  return files.find(file => fileId === file.id);
});
const selectDialApiHost = createSelector([rootSelector], state => state.dialApiHost);

export const FilesSelectors = {
  selectFiles,
  selectFilesByIds,
  selectFileById,
  selectDialApiHost,
};

export const FilesActions = filesSlice.actions;
