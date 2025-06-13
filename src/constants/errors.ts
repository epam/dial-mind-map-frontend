export const errorsMessages = {
  generalClient: 'Error happened during answering. Please check your internet connection and try again.',
  unauthorized: 'Unauthorized',
  generalServer:
    'Sorry, we were unable to process your request at this time due to a server error. Please try again later. Thank you for your patience and understanding.',
  customThemesConfigNotProvided: 'The custom config host url not provided. Please recheck application settings',
  429: 'Due to high demand our AI capacities are overloaded. We understand the problem and continuously searching for the way to extend capacities of the service (unfortunately there limits on cloud providers). Please, try again in a couple of minutes or try another model',
  401: 'Authorization failed. Please reload the page and login again.',
  403: 'Forbidden',
  400: 'Invalid request',
  404: 'Not found',
  timeoutError:
    'Server is taking too long to respond due to either poor internet connection or excessive load. Please check your internet connection and try again. You also may try different model.',
  createFailed: 'Failed to create mindmap. Please check your input and try again.',
  getFailed: 'Failed to fetch mindmap. Please check your input and try again.',
  patchFailed: 'Failed to patch mindmap. Please check your input and try again.',
  editNodeFailed: 'Failed to edit mindmap`s node. Please check your input and try again.',
  createNodeFailed: 'Failed to create mindmap`s node. Please check your input and try again.',
  deleteNodeFailed: 'Failed to delete mindmap`s node. Please check your input and try again.',
  deleteEdgeFailed: 'Failed to delete mindmap`s edge. Please check your input and try again.',
  createEdgeFailed: 'Failed to create mindmap`s edge. Please check your input and try again.',
  updateEdgeFailed: 'Failed to update mindmap`s edge. Please check your input and try again.',
  getDocumentsFailed: 'Failed to fetch mindmap`s documents. Please check your input and try again.',

  contentFiltering:
    'The response was filtered due to the prompt triggering Azure OpenAI’s content management policy. Please modify your prompt and retry.',
  unsupportedConversationsDataFormat: 'Import of conversations failed because of unsupported data format',
  unsupportedPromptsDataFormat: 'Import of prompts failed because of unsupported data format',
  localStorageQuotaExceeded:
    'Conversation storage capacity exceeded. Please clean up some conversations (prefer ones with media attachments) and try again.',
  errorDuringEntityRequest: (entityType: string) =>
    `Error happened during ${entityType} request. Please try again later.`,
  errorGettingUserBucket:
    'Error happened during getting file user bucket. Please contact your administrator or try to reload the page.',
  noModelsAvailable:
    'You do not have any available models. Please contact your administrator or try to reload the page.',
  importConversationsFailed: 'Import of conversations failed',
  uploadingConversationsError: 'An error occurred while uploading conversations and folders',
  importPromptsFailed: 'Import of prompts failed',
  uploadingPromptsError: 'An error occurred while uploading prompts and folders',
  exportFailed: 'Export failed',
  shareFailed: 'Sharing failed. Please try again later.',
  shareWithExternalFilesFailed:
    'Sharing failed. You are only allowed to share conversations with attachments from "All files"',
  acceptShareFailed:
    'Accepting sharing invite failed. Please open share link again to being able to see shared resource.',
  acceptShareNotExists: 'We are sorry, but the link you are trying to access has expired or does not exist.',
  revokeAccessFailed: 'Revoking access failed. Please try again later.',
  discardSharedWithMeFailed: 'Discarding shared with you resource failed. Please try again later.',
  shareByMeListingFailed: 'Getting shared by you resources failed. Please reload the page to get them again.',
  shareWithMeListingFailed: 'Getting shared with you resources failed. Please reload the page to get them again.',
  notValidEntityType: 'You made a request with an unavailable or nonexistent entity type',
  entityNameInvalid: 'The name is invalid. Please, rename it',
  entityPathInvalid: 'The parent folder name is invalid. Please, rename it',
  entityNameInvalidExternal: 'The name is invalid',
  entityPathInvalidExternal: 'The parent folder name is invalid',
  publicationFailed: 'Creation of publication failed. Please try again later.',
  publicationWithExternalFilesFailed:
    'Publishing failed. You are only allowed to publish conversations with attachments from "All files"',
  publicationsUploadFailed: 'Publications uploading failed.',
  publicationUploadFailed: 'Publication uploading failed.',
  publishedItemsUploadFailed: 'Published items uploading failed.',
  publicationApproveFailed: 'Publication approving failed.',
  publicationRejectFailed: 'Publication rejecting failed.',
  publishingByMeItemsUploadingFailed: 'Published by me items uploading failed.',
  rulesUploadingFailed: 'Rules uploading failed.',
  fetchDetailsFailed: 'Fetching application details failed. Please try again later.',
};
