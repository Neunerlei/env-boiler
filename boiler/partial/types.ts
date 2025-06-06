import {Partial} from './Partial.js';
import {PartialSortRules} from './PartialSortRules.js';
import {IFs} from 'memfs';
import {FsUtils} from '../util/FsUtils.js';
import {FileBuilder} from '../filebuilder/FileBuilder.js';
import {BodyBuilderCollector} from '../filebuilder/BodyBuilderCollector.js';

export type BodyBuilder<T = any> = (body: T, context: { filename: string, partial: Partial }) => Promise<void>;

export interface PartialDefinition {
    /**
     * A unique name for this partial
     */
    key: string;

    /**
     * A human-readable name to display to the user
     */
    name: string;

    /**
     * A list of software versions that this partial provides. The user will be asked to select one of these versions.
     * If only a single version is provided, this version will be used without asking the user.
     */
    versions?: string[];

    /**
     * If set to true, this partial is registered as "being able to run on its own" and does not
     * need other partials to be present. This describes partials that provide a language runtime or similar.
     */
    standalone?: boolean;

    /**
     * An optional list of other partials that are required for this partial to work.
     * The list should contain the keys of the required partials. If any of the required partials is not present in the registry an error will be thrown.
     * All required partials will automatically be added to the stack.
     */
    requires?: Array<string> | (() => Promise<string[]>);

    /**
     * An optional function that allows you to configure rules on how this partial should be sorted in the stack.
     * This function will be called after all partials have been added to the stack.
     * @param rules
     */
    sort?: (rules: PartialSortRules) => Promise<void>;

    /**
     * Determines if the user can manually select this partial.
     * If a callable is given: It receives ONLY the selected standalone partials, and does not refresh when optional partials are added (Inquirer can not update the choices at a later state).
     * Can be set to "false", indicating it should never be selectable by a user, which means it can only be registered as a dependency using "requires" of another partial.
     * @param selectedKeys
     */
    selectable?: ((usedKeys: string[]) => Promise<boolean>) | false;

    /**
     * Loads all files that this partial should provide into the provided file system.
     * Also receives a utility class that helps loading files and directories.
     * @param mfs The file system to load the files into
     * @param fsUtil A utility class that helps loading files and directories
     */
    loadFiles?: (mfs: IFs, fsUtil: FsUtils) => Promise<void>;

    /**
     * This hook is called after all files have been loaded into the file system.
     * It can be used to generate additional files or to modify the existing ones.
     * You can either manipulate the filesystem directly or trigger a file builder,
     * which is a hook that allows all active partials to contribute to the file generation.
     *
     * See the "bodyBuilders" property for more information.
     *
     * @param mfs
     */
    buildFiles?: (mfs: IFs, fb: (filename: string) => FileBuilder) => Promise<void>;

    /**
     * A list of hooks, that allow partials to act together on a certain set of files.
     * This is normally used for well known files like "composer.json" or "package.json".
     * The builders are only used if one of the other partials in the stack has a file builder for the same file.
     */
    bodyBuilders?: (collector: BodyBuilderCollector) => Promise<void>;

    /**
     * A callback to be executed before any other actions occur.
     * Useful for setting up some initial state or to ask the user for some input.
     */
    init?: () => Promise<void>;

    /**
     * The main callback of the partial to do stuff.
     */
    apply?: () => Promise<void>;

    /**
     * A callback to be executed after all partials have been applied.
     * This can be useful to do some final cleanup or to execute some final tasks.
     */
    applyPost?: () => Promise<void>;
}

export type PartialFactory = ((partial: Partial) => PartialDefinition);
